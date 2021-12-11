<template>
    <div id="menu_list">
        <ul id="list">
            <li v-for="item in list" :id="item.id" :key="item.id">{{ item.title }}
                <button @click="delBtn(item)">削除</button>
            </li>
        </ul>
        <button @click="saveClick" v-bind:disabled="saveBrnDisabled">保存</button>
        <button @click="clearClick" v-bind:disabled="clearBtnDisabled">初期化</button>
        <br>
        {{ msg }}
    </div>

</template>

<script lang="ts">
    import {Vue, Component} from 'vue-property-decorator';
    import {ChromeMenu, MenuItem} from "./chrome_menu";

    @Component
    export default class MenuList extends Vue {
        public list: MenuItem[] = [];
        public saveBrnDisabled = false;
        public clearBtnDisabled = false;
        public msg = '';
        private msgClearTimeoutId: number | null = null;
        public debugState = false;


        constructor() {
            super();
            ChromeMenu.getChromeMenu().then((result) => {
                result.forEach((i) => this.list.push(i));
            })
        }

        public reloadList() {
            this.list.splice(0, this.list.length);
            ChromeMenu.getChromeMenu().then((result) => {
                result.forEach((i) => this.list.push(i))
            })
        }

        public pushMsg(msg: string) {
            if (this.msgClearTimeoutId !== null) {
                clearTimeout(this.msgClearTimeoutId)
            }
            this.msg = msg;
            this.msgClearTimeoutId = setTimeout(() => {
                this.msg = '';
                this.msgClearTimeoutId = null
            }, 5000)
        }

        public addItem(id: string, title: string) {
            this.list.push({id: id, title: title})
        }

        public delBtn(item: MenuItem) {
            this.list.splice(this.list.indexOf(item), 1);
            this.pushMsg("削除しました: " + item.title)
        }

        public saveClick() {
            this.saveBrnDisabled = true;
            this.clearBtnDisabled = true;
            this.pushMsg("保存中です");
            // noinspection TypeScriptUnresolvedFunction
            chrome.storage.local.set({menuItem: this.list}, () => {
                this.saveBrnDisabled = false;
                this.clearBtnDisabled = false;
                this.pushMsg("保存しました");
                ChromeMenu.makeMenu(this.list).then(() => this.pushMsg("メニューを更新しました"));
            })
        }

        public clearClick() {
            new Promise<boolean>((resolve) => {
                resolve(confirm("本当に初期化しますか？"))
            }).then((result) => {
                if (result) {
                    this.list.splice(0, this.list.length);
                    this.pushMsg("初期化しました。保存しない限りはデータは消えません。")
                } else {
                    this.pushMsg("キャンセルしました")
                }
            })

        }
    }
</script>

<style>

</style>
