<template>
    <button @click="onClick">{{ msg }}</button>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    @Component
    export default class Options extends Vue {
        public msg: string = 'test msg';

        public onClick(): void {
            this.msg = 'change msg';
        }
    }
</script>

<style>

</style>
