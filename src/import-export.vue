<template>
    <div id="import_export">
        <label for="import_export">設定インポート・エクスポート</label><br>
        <label for="import_file">インポートファイル(json):</label>
        <input type="file" id="import_file" accept="application/json" @change="Import" /><br>
        <button @click="Export">エクスポート</button><br>
        {{ msg }}
    </div>
</template>

<script lang="ts">
    import {Vue, Component, Prop} from 'vue-property-decorator';
    import {ChromeMenu} from "./chrome_menu";

    @Component
    export default class ImportExport extends Vue {
        msg: string = '';
        used: boolean = false;

        updateMsg(msg: string){
            this.msg = msg;
        }
        async Export() {
            this.updateMsg("");
            ChromeMenu.localStorageAllGet().then(obj => {
                const data = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(data);
                const a = document.createElement("a");
                document.body.appendChild(a);
                a.download = "export.json";
                a.href = url;
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            });
        }
        async Import(e: {target: HTMLInputElement}) {
            this.updateMsg("");
            const f = e.target.files?.item(0);
            if (f == null) {
                this.updateMsg("ファイルが指定されていません");
                return
            }
            const text = await f.text();
            await ChromeMenu.localStorageImport(text);
            this.$emit("reloadMenu");
            this.updateMsg("インポート完了しました");
        }
    }
</script>

<style>

</style>
