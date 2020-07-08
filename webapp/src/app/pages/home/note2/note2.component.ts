import {
    AfterViewInit,
    Component,
    ElementRef, EventEmitter, OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {
    NzContextMenuService,
    NzDropdownMenuComponent, NzFormatBeforeDropEvent,
    NzFormatEmitEvent, NzMessageService,
    NzTreeComponent,
    NzTreeNode
} from 'ng-zorro-antd';
import {fromEvent, Observable, of, Subject, zip} from 'rxjs';
import {concatAll, delay, filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {NoteService} from '../note/note.service';
import {Note2Service} from './note2.service';
import {MoveItem} from '../../../model/move-item';


@Component({
    selector: 'app-note2',
    templateUrl: './note2.component.html',
    styleUrls: ['./note2.component.less'],
})
export class Note2Component implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('treeDiv', {static: true}) treeDiv: ElementRef;
    @ViewChild('nzTree', {static: true}) nzTree: NzTreeComponent;

    @Output('menuList') menuList = new EventEmitter(); // 触发获取菜单
    @Output('nodeList') nodeList = new EventEmitter(); // 触发获取右侧节点
    @Output('clearList') clearList = new EventEmitter(); // 清除右侧表单
    @Output('activatedNodeEmit') activatedNodeEmit = new EventEmitter(); // 活动节点变更

    destroy$ = new Subject();
    isSpinning = false;
    editId: string;
    editName: string;
    pid = 0;
    // activated node
    activatedNode?: NzTreeNode;
    nodes = [];
    dragNodeLevel: any;
    dragNodeParentId: any;
    moveItem = new MoveItem();

    activeItem: any;
    activeItemId: number;
    targetItem: any;

    Visible = false;
    isOkLoading = false;
    addFileItem: { name: string, pid: number } = {name: '', pid: this.pid};

    openFolder(data: NzTreeNode | NzFormatEmitEvent): void {
        // do something if u want
        if (data instanceof NzTreeNode) {
            data.isExpanded = !data.isExpanded;
        } else {
            const node = data.node;
            if (node) {
                node.isExpanded = !node.isExpanded;
            }
        }
    }

    activeNode(data: NzFormatEmitEvent): void {
        this.activatedNode = data.node!;
        this.activatedNodeEmit.emit(this.activatedNode.key);
    }

    contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
        this.nzContextMenuService.create($event, menu);
    }

    selectDropdown(): void {
        // do something
    }

    constructor(private nzContextMenuService: NzContextMenuService,
                private msgService: NzMessageService,
                private el: ElementRef,
                private noteService: NoteService,
                private note2Service: Note2Service,
                private render2: Renderer2) {
    }

    ngOnInit() {
    }

    nzEvent(event: NzFormatEmitEvent): void {
        // 树形结构移动
        const dropNode = event.dragNode; // 移动的节点
        const node = event.node; // 操作的节点
        // 判断是否为同级移动
        // 判断是否为根结点
        if (!dropNode.parentNode) {
            this.updateFootMenuSort(event);
            return;
        }

        if (dropNode.level === node.level
            && this.dragNodeLevel === dropNode.level
            && this.dragNodeParentId === dropNode.parentNode.origin.id) {
            // 同级移动  判断是都同级下排序移动
            // 同一节点下排序
            this.updateMenuSort(dropNode.parentNode);
        } else {
            // 不同级
            this.moveItem.mid = dropNode.parentNode.origin.id;
            this.moveItem.itemid = dropNode.origin.id;
            this.dragMoveItem(dropNode.parentNode);
        }

    }


    dragEnd(event: NzFormatEmitEvent): void {
        console.log(event);
    }

    startEdit($event, node): void {
        $event.stopPropagation();
        this.editId = node.key;
        this.editName = node.title;
    }

    inputClick($event) {
        $event.stopPropagation();
    }

    stopEdit(node): void {
        this.editId = null;

        if (this.editName === node.title) {
            return;
        }

        this.editName = null;

        this.editFile(node);
    }

    showModal(): void {
        this.Visible = true;
    }

    handleOk(): void {
        this.isOkLoading = true;

        this.note2Service.addFile(this.addFileItem).subscribe(
            res => {
                this.Visible = false;
                this.isOkLoading = false;
                this.menuList.emit();
            }
        );
    }

    handleCancel(): void {
        this.Visible = false;
    }

    // 更新文件夹
    editFile(data) {
        this.note2Service.editFile({mid: data.key, name: data.title}).subscribe(
            res => {
                this.menuList.emit();
            }
        );
    }

    add(e, key) {

        e.stopPropagation();

        this.addFileItem.pid = this.pid = key;
        this.addFile();
    }

    // 新增文件夹
    addFile() {


        this.showModal();
    }

    // 新增根文件夹
    addFootFile() {

        this.addFileItem.pid = 0;
        this.showModal();
    }

    // 删除节点
    deleteNode(e, key) {
        // 阻止冒泡
        e.stopPropagation();


        // 删除节点
        this.note2Service.delFile(key).subscribe(
            res => {
                this.menuList.emit(key);

                this.msgService.success('清除成功');
            }, error => {
                this.msgService.warning('清除失败');
            }
        );
    }

    // 移动文件夹
    dragMoveItem(node: NzTreeNode) {
        this.note2Service.moveItem(this.moveItem).subscribe(res => {
            if (node.children.length > 1) {
                this.updateMenuSort(node);
            }
        });
    }


    // 根结点排序
    updateFootMenuSort(event: NzFormatEmitEvent) {
        const dropNode = event.dragNode; // 移动的节点
        const node = event.node; // 操作的节点
        const parentId = dropNode.parentNode ? dropNode.parentNode.origin.id : 0;
        if (dropNode.level === node.level
            && this.dragNodeLevel === dropNode.level
            && this.dragNodeParentId === parentId) {
            // 同级移动  判断是都同级下排序移动
            // 同一节点下排序
            this.updateRootMenuSort();
        } else {
            // 不同级 先移动
            this.moveItem.mid = 0;
            this.setMenuItem();
            this.moveItem.itemid = dropNode.origin.id;
            this.dragMoveRootItem();
        }
    }

    updateRootMenuSort() {
        const menuArr = this.nzTree.getTreeNodes().map(item => item.origin.id);
        this.note2Service.updateMenuSort({pid: 0, mid_arr: menuArr}).subscribe(
            res => {
                console.log(res);
                this.menuList.emit();
            }
        );
    }

    dragMoveRootItem() {
        // 移动文件夹
        const menuArr = this.nzTree.getTreeNodes();
        this.note2Service.moveItem(this.moveItem).subscribe(res => {
            if (menuArr.length > 1) {
                this.updateMenuRootSort(menuArr);
            }
        });
    }

    updateMenuRootSort(data: Array<NzTreeNode>) {
        const menuArr = data.map(item => item.origin.id);
        this.note2Service.updateMenuSort({pid: 0, mid_arr: menuArr}).subscribe(
            res => {
                console.log(res);
                this.menuList.emit();
            }
        );
    }

    updateMenuSort(node: NzTreeNode) {
        const menuArr = node.children.map(item => item.origin.id);
        this.note2Service.updateMenuSort({pid: node.origin.id, mid_arr: menuArr}).subscribe(
            res => {
                console.log(res);
                this.menuList.emit();
            }
        );
    }

    // 移动校检
    beforeDrop(arg: NzFormatBeforeDropEvent) {
        this.dragNodeLevel = arg.dragNode.level;
        if (arg.dragNode.parentNode) {
            this.dragNodeParentId = arg.dragNode.parentNode.origin.id;
        } else {
            this.dragNodeParentId = 0;
        }
        if (arg.pos === 0) {
            // 移动到内部
            return of(true);
        } else {
            // 移动到前后
            return of(true);
        }
    }

    // 复制
    copy(item: NzTreeNode) {
        this.activeItemId = item.origin.id;
        this.setMenuItem();
    }

    // 剪切
    cut(item: NzTreeNode) {
        this.activeItemId = item.origin.id;
        this.setMenuItem();
    }

    // 设置菜单节点拖动
    setMenuItem() {
        this.moveItem.drag_file = 'true';
        this.moveItem.is_catalog = 3;
    }

    // 粘贴
    paste(item: NzTreeNode) {
        this.targetItem = item;
        this.moveItem.mid = item.origin.id;
        this.moveItem.itemid = this.activeItemId;
        this.note2Service.moveItem(this.moveItem).subscribe(res => {
            //  菜单粘贴 刷新左侧菜单 is_catalog:2
            //  节点粘贴 刷新右侧 is_catalog:3
            if (this.moveItem.is_catalog === 2) {
                this.nodeList.emit();
            } else if (this.moveItem.is_catalog === 3) {
                this.menuList.emit();
            }
        });
    }


    ngAfterViewInit() {
        const treeDivBox = this.treeDiv.nativeElement;

        // 右侧表单拖拽至左侧
        this.noteService.dragSubject.pipe(
            switchMap(res =>
                zip(of(res), fromEvent(treeDivBox, 'mouseup').pipe(
                    filter((res: any) => {
                        return this.el.nativeElement.querySelector('.ant-tree .ant-tree-node-content-wrapper:hover');
                    }),)
                ).pipe(
                    take(1)
                )),
            takeUntil(this.destroy$)
        ).subscribe((res) => {
            const key = this.el.nativeElement
                .querySelector('.ant-tree .ant-tree-node-content-wrapper:hover').children[0].id;
            // 原文件夹删除,新文件夹新增
            this.note2Service.transTreeDragEnd.next({delKey: res[0], addKey: key});
        });


    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}




