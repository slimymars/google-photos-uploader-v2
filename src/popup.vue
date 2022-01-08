<template>
    <div id="popup">
        <ul>
            <li v-for="log in logs">
                {{ log.text }}
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

let logs = [
    {text: 'hoge'}
]

export default Vue.extend({
    data: ()=> {
        return { logs: logs
        }
    }
})

</script>

<style>

</style>
