<template>
    <div id="options">
        <MenuList ref="menu"></MenuList>
        <GooglePhotosAlbumList v-on:add-btn="addItemToMenuList" @reloadMenu="reloadMenuList"></GooglePhotosAlbumList>
    </div>
</template>

<script lang="ts">
    import GooglePhotosAlbumList from './google-photos-album.vue';
    import {Vue, Component} from 'vue-property-decorator';
    import MenuList from "./menu_list.vue";

    @Component({
        components: {
            GooglePhotosAlbumList,
            MenuList
        },
    })
    export default class Options extends Vue {
        $refs!: {
            menu: MenuList
        };

        public addItemToMenuList(obj: { id: string; title: string }) {
            this.$refs.menu.addItem(obj.id, obj.title)
        }

        public reloadMenuList() {
            this.$refs.menu.reloadList()
        }
    }

</script>

<style>

</style>
