<template>
    <div id="album_copy" v-bind:aria-disabled="true">
        <label for="album_copy">アルバムコピー機能</label>
        <label for="src-selector">移行元:</label>
        <select v-model="src" v-bind:disabled="albumListDisabled" id="src-selector">
            <option disabled value="">コピー元を選択</option>
            <option v-for="album in albumList" :value="album">{{ album.title }} {{ album.isWriteable ? '' : "(書込不可)"}}</option>
        </select>
        <label for="dist-selector"> → 移行先:</label>
        <select v-model="dist" v-bind:disabled="albumListDisabled" id="dist-selector">
            <option disabled value="">コピー先を選択</option>
            <option v-for="album in writableAlbumList" :value="album">{{ album.title }}</option>
        </select>
        <button @click="CopyStart" :disabled="CopyBtnDisabled">コピー機能は現在使用できません</button><br>
        {{ msg }}
    </div>
</template>

<script lang="ts">
    import {Vue, Component, Prop} from 'vue-property-decorator';
    import {AlbumData, GooglePhotos} from "./google-photos";
    import {ChromeMenu} from "./chrome_menu";

    @Component
    export default class AlbumCopy extends Vue {
        @Prop() albumListDisabled!: boolean;
        @Prop() albumList!: AlbumData[];

        _copyBtnDisabled = true;
        src: AlbumData | string = '';
        dist: AlbumData | string = '';
        msg: string = '';
        used: boolean = false;

        get writableAlbumList() : AlbumData[] {
            return this.albumList.filter(value=>value.isWriteable)
        }
        get CopyBtnDisabled() : boolean {
            // api上実装できないことが判明したため、常にdisabled
            return true;
            if (this._copyBtnDisabled) return true;
            return typeof this.src === 'string' || typeof this.dist === 'string';
        }
        updateMsg(msg: string){
            this.msg = msg;
        }
        async CopyStart() {
            if (typeof this.src === "string" || typeof this.dist === "string") {
                return;
            }
            this._copyBtnDisabled = true;
            try {
                const token = await ChromeMenu.getToken();
                await GooglePhotos.copyAlbum(token, this.src.id, this.dist.id, this.updateMsg);
            } catch (e) {
                this.msg = "コピー失敗しました: " + e
            }
            this._copyBtnDisabled = false;
        }
    }
</script>

<style>

</style>
