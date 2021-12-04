<template>
    <div id="album-diff">
        <label for="album-diff">アルバム比較機能</label>
        <label for="diff-src-selector">比較元:</label>
        <select v-model="src" v-bind:disabled="albumListDisabled" id="diff-src-selector">
            <option disabled value="">比較元を選択</option>
            <option v-for="album in albumList" :value="album">{{ album.title }} {{ album.isWriteable ? '' : "(書込不可)"}} {{ album.mediaItemsCount }}</option>
        </select>
        <label for="diff-dist-selector">比較先:</label>
        <select v-model="dist" v-bind:disabled="albumListDisabled" id="diff-dist-selector">
            <option disabled value="">比較先を選択</option>
            <option v-for="album in albumList" :value="album">{{ album.title }} {{ album.isWriteable ? '' : "(書込不可)"}} {{ album.mediaItemsCount }}</option>
        </select>
        <button @click="DiffStart" :disabled="DiffBtnDisabled">比較</button><br>
        <label for="diff-logger">ログ</label>
        <ul id="diff-logger">
            <li v-for="msg in msgs">{{ msg }}</li>
        </ul>
        <label for="diff-result">比較結果 (比較元にしか無いものを出力します)</label>
        <ul id="diff-result">
            <li v-for="item in result"><a :href="item.productUrl"><img :src="item.productUrl" :alt="item.id"><br>
                {{ item.id }} : {{item.description}}</a></li>
        </ul>
    </div>
</template>

<script lang="ts">
    import {Vue, Component, Prop} from 'vue-property-decorator';
    import {AlbumData, GooglePhotos, MediaItem} from "./google-photos";
    import {ChromeMenu} from "./chrome_menu";

    @Component
    export default class AlbumDiff extends Vue {
        @Prop() albumListDisabled!: boolean;
        @Prop() albumList!: AlbumData[];

        _diffBtnDisabled = true;
        src: AlbumData | string = '';
        dist: AlbumData | string = '';
        msgs: string[] = [];
        result: MediaItem[] = [];

        get DiffBtnDisabled() : boolean {
            if (this._diffBtnDisabled) return true;
            return typeof this.src === 'string' || typeof this.dist === 'string';
        }
        updateMsg(msg: string){
            this.msgs.push(msg);
        }
        async DiffStart() {
            if (typeof this.src === "string" || typeof this.dist === "string") {
                return;
            }
            this._diffBtnDisabled = true;
            this.result = [];
            try {
                const token = await ChromeMenu.getToken();
                const result = await GooglePhotos.diffAlbum(token, this.src.id, this.dist.id, this.updateMsg);
                this.result = result.AOnly;
            } catch (e) {
                this.msgs.push("比較失敗しました: " + e);
            }
            this._diffBtnDisabled = false;
        }
    }
</script>

<style>

</style>
