<template>
    <ul id="menu_list">
        <li v-for="item in list" :id="item.id">{{ item.title }}</li>
    </ul>
</template>

<script lang="ts">
    import {Vue, Component} from 'vue-property-decorator';

    interface MenuItem {
        id: string;
        title: string;
    }

    @Component
    export default class MenuList extends Vue {
        public list: MenuItem[] = [];

        private getChromeMenu(): Promise<MenuItem[]> {
            return new Promise<{ [key: string]: object }>((resolve) => {
                // noinspection TypeScriptUnresolvedFunction
                chrome.storage.local.get('menuItem', resolve)
            }).then((item) => item['menuItem']).then(obj => obj === undefined ? [] : <MenuItem[]>obj)
        }

        constructor() {
            super();
            this.getChromeMenu().then((result) => this.list = result)
        }

        public addItem(id: string, title: string) {
            this.list.push({id: id, title: title})
        }
    }
</script>

<style>

</style>
