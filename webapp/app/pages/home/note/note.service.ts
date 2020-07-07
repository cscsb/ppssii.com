import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UrlService} from '../../../common/service/url.service';
import {Api} from '../../../api/api';
import {Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {Menu} from '../../../model/menu';
import {Res} from '../../../model/response';

interface Item {
    mid?: number | string;
    content?: string;
}

export interface ItemArrSort {
    mid: number | string;
    item_id_arr: Array<any>;
}

@Injectable({
    providedIn: 'root'
})
export class NoteService {

    // uuid主体

    uuidSubject: Subject<string> = new Subject();

    // drag主体
    dragSubject: Subject<any> = new Subject<any>();


    constructor(private http: HttpClient,
                private url: UrlService) {
    }


    // 获取菜单列表
    getMenus() {
        const url = this.url.getUrl(Api.menuList);
        return this.http.post(url, {}).pipe(
            map((res: Res) => {
                // 转换tree结构
                const data: Menu[] = res.data;

                if (res.data instanceof Array) {
                    // res.data = data.map(item => {
                    //     return Object.assign(item, {
                    //         title: item.name,
                    //         key: item.id,
                    //         expanded: true,
                    //         children: item.child
                    //     })
                    // })
                    this.setTreeData(res.data);
                } else {
                    res.data = [];
                }
                return res;
            })
        );
    }

    // 获取菜单列表
    getUser() {
        const url = this.url.getUrl(Api.me);
        return this.http.post(url, {});
    }

    // 获取Uuid
    getUuid() {
        const url = this.url.getUrl(Api.makeUuid);
        return this.http.post(url, {});
    }

    // 添加子节点
    addItem(data: Item) {
        const url = this.url.getUrl(Api.addItem);
        return this.http.post(url, data);
    }

    // 获取子节点
    getItems(data: Item) {
        const url = this.url.getUrl(Api.menuItem);
        return this.http.post(url, data);
    }

    // 删除子节点
    editItem(data: { itemid: number, content: string }) {
        const url = this.url.getUrl(Api.updateItem);
        return this.http.post(url, data);
    }


    // 删除子节点
    delItem(data) {
        const url = this.url.getUrl(Api.delItem);
        return this.http.post(url, {itemid: data});
    }

    // 笔记排序
    updateItemSort(data: ItemArrSort) {
        const url = this.url.getUrl(Api.updateItemSort);
        return this.http.post(url, data);
    }

    setTreeData(data) {
        data = data.map(item => {
            return Object.assign(item, {
                title: item.name,
                key: item.id,
                expanded: false,
                children: item.child ? this.setTreeData(item.child) : []
            });
        });
        return data;
    }


}
