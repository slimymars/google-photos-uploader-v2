<template>
    <div id="google_photos">
        <button @click="onClick" v-bind:disabled="albumBtnDisabled">{{ albumBtnMsg }}</button>
        <label for="album-selector">アルバムリスト：</label>
        <select v-model="selected" v-bind:disabled="albumListDisabled" id="album-selector">
            <option disabled :value="''">{{ msg }}</option>
            <option v-for="album in albumList" :key="album.id" :value="{id: album.id, title: album.title}"
                    :disabled="!album.isWriteable">{{ album.title}}
            </option>
        </select>
        <button @click="addBtn" v-bind:disabled="addBtnDisabled">追加</button>
        <br>
        <input v-model="newAlbumName" placeholder="新規アルバム名">
        <button @click="makeNewAlbumBtn" v-bind:disabled="newAlbumBtnDisabled">新規アルバム作成</button>
        <br>
        <button @click="authClearBtn" v-bind:disabled="authClearBtnDisabled">認証情報クリア</button><br>
        {{ debugMsg }}
        <hr />
        <ImportExport @reloadMenu="reloadMenuList"></ImportExport>
        <hr />
        <AlbumDiff v-bind:album-list="albumList" v-bind:albumListDisabled="albumListDisabled"></AlbumDiff>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import {ChromeMenu} from "./chrome_menu";
    import {AlbumData, GooglePhotos} from "./google-photos";
    import AlbumCopy from "./google-photos-copy-album.vue";
    import AlbumDiff from "./google-photos-diff-album.vue";
    import ImportExport from './import-export.vue';


    @Component({
        components: {AlbumCopy, AlbumDiff, ImportExport}
    })
    export default class GooglePhotosAlbumList extends Vue {
        public albumList: AlbumData[] = [];
        public msg = "アルバムリスト取得ボタンで取得してください";
        public selected: AlbumData | string = "";
        albumBtnDisabled = false;
        addBtnDisabled = true;
        albumListDisabled = true;
        albumBtnMsg = "アルバムリスト取得";
        newAlbumBtnDisabled = false;
        newAlbumName = '';
        debugMsg = '';
        authClearBtnDisabled = false;

        public async makeNewAlbumBtn() {
            this.newAlbumBtnDisabled = true;
            const token = await ChromeMenu.getToken();
            const newData = await GooglePhotos.createAlbum(token, this.newAlbumName);
            this.albumList.push({id: newData.id, title: newData.title, isWriteable: newData.isWriteable, mediaItemsCount: newData.mediaItemsCount});
            this.newAlbumBtnDisabled = false;
        }
        public async onClick() {
            this.albumBtnDisabled = true;
            this.albumBtnMsg = "取得中";
            this.selected = '';
            this.albumListDisabled = true;
            this.addBtnDisabled = true;

            this.albumList = [];
            try {
                const token = await ChromeMenu.getToken();
                // ToDo: このあたりgoogle-photos.tsに移動したいけど、this.albumList.pushをうまいことする方法がわからん
                let nextPageToken = '';
                do {
                    const json_data = await GooglePhotos.getAlbumJson(token, nextPageToken);
                    // this.debugMsg = this.debugMsg + JSON.stringify(json_data);
                    json_data.albums.forEach(value => {
                        const data: AlbumData = {
                            id: value.id,
                            title: value.title,
                            isWriteable: value.isWriteable ? value.isWriteable : false,
                            mediaItemsCount: value.mediaItemsCount
                        };
                        this.albumList.push(data);
                    });
                    nextPageToken = json_data.hasOwnProperty('nextPageToken') ? json_data.nextPageToken : '';
                } while (nextPageToken !== '');
            } catch (e) {
                console.log("アルバムリストの取得に失敗しました: " + e);
            }
            this.albumBtnMsg = "アルバムリスト再取得";
            this.albumBtnDisabled = false;
            this.albumListDisabled = false;
            this.addBtnDisabled = false;
            this.msg = "追加するアルバムを選択してください";
        }

        public addBtn() {
            if (typeof this.selected === 'string') {
                console.log("why call?")
            } else {
                this.$emit('add-btn', this.selected)
            }
        }

        public authClearBtn() {
            this.authClearBtnDisabled = true;
            ChromeMenu.authClear().then(() => this.authClearBtnDisabled = false)
        }

        public reloadMenuList() {
            this.$emit("reloadMenu");
        }

    }
</script>

<style scoped>

</style>
