import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {fromEvent, Observable, Subject} from 'rxjs';
import {takeUntil, throttleTime} from 'rxjs/operators';
import {NzContextMenuService, NzDropdownMenuComponent, NzFormatBeforeDropEvent, NzMessageService} from 'ng-zorro-antd';
import {ItemArrSort, NoteService} from './note.service';
import {Res} from '../../../model/response';
import {Router} from '@angular/router';
import {LoginService} from '../../../login/login.service';
import {Note2Service} from '../note2/note2.service';
import {Note2Component} from '../note2/note2.component';
import {User} from '../../../model/user';

@Component({
    selector: 'app-note',
    templateUrl: './note.component.html',
    styleUrls: ['./note.component.less']
})
export class NoteComponent implements OnInit, AfterViewInit, OnDestroy {
    keyEnter: Observable<any> = fromEvent(window, 'keyup.enter');

    @ViewChild('treeNode') treeNode: Note2Component;

    @ViewChild('doneList', {static: true}) doneList: CdkDropList;
    @ViewChild('buttonEvent', {static: true}) buttonEvent: ElementRef;

    submitSubject: Subject<string> = new Subject();

    destroy$ = new Subject();
    user: User = new User();
    isSpinning = false;
    fieldContent = '';
    editId = null;
    size = 'small';
    activatedId = null;
    done = [];
    itemArrSort: ItemArrSort;

    activeItem: any;
    targetItem: any;

    // 表单拖动事件
    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            // 同一区域内 移动数据
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            this.updateItemSort();
        } else {
            // 不同区域内 移动数据
            // transferArrayItem(event.previousContainer.data._data,
            //     event.container.data,
            //     event.previousIndex,
            //     event.currentIndex);
        }
    }

    constructor(private msgService: NzMessageService,
                private noteService: NoteService,
                private loginService: LoginService,
                private note2Service: Note2Service,
                private route: Router,
                private nzContextMenuService: NzContextMenuService) {

    }


    ngOnInit(): void {
        this.onTreeDragEnd();

        this.getUser();
    }

    // 移动
    dragStarted(item: any, i: number, dragEl: HTMLElement) {
        this.noteService.dragSubject.next({item, index: i});
    }

    onTreeDragEnd() {
        this.note2Service.transTreeDragEnd.pipe(
            takeUntil(this.destroy$)
        )
            .subscribe(res => {
                this.addItemToOther(res.addKey, res.delKey.item.content);
                this.delItem(res.delKey.item);
            }, error => {
                console.log(error);
            });
    }

    startEdit(id: string) {
        this.editId = id;
    }

    stopEdit(item) {
        this.editId = null;
        this.editItem(item);
    }

    editItem(item) {
        this.noteService.editItem({itemid: item.id, content: item.content})
            .subscribe(
                res => {
                    this.getItems();
                }
            );
    }

    getMenuList(key?: string) {
        this.treeNode.isSpinning = true;
        this.noteService.getMenus().subscribe(res => {
            this.treeNode.isSpinning = false;
            this.treeNode.nodes = res.data;
            if (this.treeNode.activatedNode && key === this.treeNode.activatedNode.key) {
                this.clearList();
            }
        });
    }

    clearList() {
        this.done = [];
    }

    getUser() {
        this.noteService.getUser().subscribe((res: any) => {
            if (res.code === 401) {
                // 游客
                if (!localStorage.getItem('uuid')) {
                    this.getUuid();
                }

            } else {
                this.user = res;
                // 登录用户
                this.getMenuList();
            }
        });
    }

    getUuid() {
        this.noteService.getUuid().subscribe((res: Res) => {
            // 设置uuid
            this.noteService.uuidSubject.next(res.data.uuid);
            localStorage.setItem('uuid', res.data.uuid);
            // 获取菜单
            this.getMenuList();
        });
    }

    // 退出
    logout() {
        this.route.navigateByUrl('login');
        localStorage.removeItem('uuid');
        sessionStorage.removeItem('token');
    }

    // 活动节点变动
    activatedNodeChange(id) {
        const key = this.treeNode.activatedNode.key;
        if (this.activatedId === key) {
            return;
        } else {
            this.activatedId = key;
        }
        this.getItems();
    }


    submit() {
        if (this.treeNode.activatedNode) {
            this.submitSubject.next(this.fieldContent);
        } else {
            this.msgService.warning('请选择一个文件夹');
        }

    }

    addItem(content: string) {
        const key = this.treeNode.activatedNode.key;
        this.noteService.addItem({mid: key, content}).subscribe(
            res => {
                this.msgService.success('添加成功');
                this.getItems();
            }
        );
    }

    addItemToOther(key, content: string) {
        this.noteService.addItem({mid: key, content}).subscribe(
            res => {
                this.msgService.success('移动成功');
            }
        );
    }

    getItems() {
        const key = this.treeNode.activatedNode.key;
        this.isSpinning = true;
        this.noteService.getItems({mid: key}).subscribe(
            (res: Res) => {
                this.isSpinning = false;
                this.done = res.data.items;
            }
        );
    }

    // 删除节点
    delItem(item) {
        this.isSpinning = true;
        this.noteService.delItem(item.id).subscribe(
            res => {
                this.getItems();
            }
        );
    }

    //  节点排序
    updateItemSort() {
        const itemArr = this.done.map(item => item.id);
        const mid = this.done[0].mid;
        this.noteService.updateItemSort({mid, item_id_arr: itemArr}).subscribe(
            res => {
                this.getItems();
            }
        );
    }

    contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, item): void {
        this.done.map(x => x.active = false);
        item.active = true;
        this.nzContextMenuService.create($event, menu);
    }

    // 复制
    copy(item) {
        this.activeItem = item;
        this.treeNode.activeItemId = item.id;
        this.setMoveItem();
    }

    // 剪切
    cut(item) {
        this.activeItem = item;
        this.activeItem = item;
        this.treeNode.activeItemId = item.id;
        this.setMoveItem();
    }

    // // 粘贴
    // paste(item) {
    //     this.activeItem = item;
    // }

    // 设置子节点操作到菜单
    setMoveItem() {
        this.treeNode.moveItem.is_catalog = 2;
        this.treeNode.moveItem.drag_file = 'false';
    }


    ngAfterViewInit() {
        // 确认事件
        this.submitSubject.pipe(
            throttleTime(500), // 防抖函数
            takeUntil(this.destroy$) // 退订
        ).subscribe(res => {
            const key = this.treeNode.activatedNode.key;
            this.noteService.addItem({mid: key, content: res})
                .subscribe(
                    res => {
                        this.msgService.success('添加成功');
                        this.fieldContent = '';
                        this.getItems();
                    }
                );
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

