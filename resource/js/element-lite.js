(function () {
    const h = Vue.h;

    function makeIcon(name) {
        return {
            name,
            render() {
                return h('span', {
                    class: ['ep-lite-icon', 'ep-lite-icon-' + name.toLowerCase()]
                });
            }
        };
    }

    const iconNames = [
        'Tools', 'Grid', 'CollectionTag', 'Lock', 'View', 'Operation',
        'Search', 'ArrowRight', 'Folder', 'FolderOpened', 'HomeFilled',
        'Bell', 'Setting'
    ];

    window.ElementPlusIconsVue = Object.fromEntries(iconNames.map(name => [name, makeIcon(name)]));

    const ElIcon = {
        name: 'ElIcon',
        props: { size: [Number, String] },
        template: `<span class="el-icon" :style="size ? { fontSize: size + 'px' } : null"><slot /></span>`
    };

    const ElButton = {
        name: 'ElButton',
        props: {
            type: String,
            size: String,
            icon: String,
            circle: Boolean,
            round: Boolean,
            block: Boolean,
            plain: Boolean
        },
        template: `
            <button
                type="button"
                :class="['el-button', type && 'el-button--' + type, size && 'el-button--' + size, circle && 'is-circle', round && 'is-round', block && 'is-block', plain && 'is-plain']"
            >
                <el-icon v-if="icon"><component :is="icon" /></el-icon>
                <slot />
            </button>
        `
    };

    const ElInput = {
        name: 'ElInput',
        props: {
            modelValue: String,
            placeholder: String,
            clearable: Boolean
        },
        emits: ['update:modelValue', 'input'],
        methods: {
            update(event) {
                const value = event.target.value;
                this.$emit('update:modelValue', value);
                this.$emit('input', value);
            },
            clear() {
                this.$emit('update:modelValue', '');
                this.$emit('input', '');
            }
        },
        template: `
            <span class="el-input">
                <span class="el-input__wrapper">
                    <span v-if="$slots.prefix" class="el-input__prefix"><slot name="prefix" /></span>
                    <input class="el-input__inner" :value="modelValue" :placeholder="placeholder" @input="update">
                    <button v-if="clearable && modelValue" class="el-input__clear" type="button" @click="clear">×</button>
                </span>
            </span>
        `
    };

    const ElMenu = {
        name: 'ElMenu',
        props: { defaultActive: String },
        emits: ['select'],
        provide() {
            return {
                elMenu: {
                    active: () => this.defaultActive,
                    select: (index) => this.$emit('select', index)
                }
            };
        },
        template: '<div class="el-menu"><slot /></div>'
    };

    const ElMenuItemGroup = {
        name: 'ElMenuItemGroup',
        props: { title: String },
        template: '<div class="el-menu-item-group"><div class="el-menu-item-group__title">{{ title }}</div><slot /></div>'
    };

    const ElMenuItem = {
        name: 'ElMenuItem',
        inject: ['elMenu'],
        props: { index: String },
        computed: {
            active() {
                return this.elMenu && this.elMenu.active() === this.index;
            }
        },
        template: `<div :class="['el-menu-item', active && 'is-active']" @click="elMenu.select(index)"><slot /></div>`
    };

    const ElDrawer = {
        name: 'ElDrawer',
        props: {
            modelValue: Boolean,
            size: { type: String, default: '280px' },
            direction: String,
            withHeader: Boolean
        },
        emits: ['update:modelValue'],
        template: `
            <teleport to="body">
                <div v-if="modelValue" class="el-overlay" @click="$emit('update:modelValue', false)">
                    <aside class="el-drawer" :style="{ width: size }" @click.stop>
                        <slot />
                    </aside>
                </div>
            </teleport>
        `
    };

    const ElDialog = {
        name: 'ElDialog',
        props: {
            modelValue: Boolean,
            title: String,
            width: { type: String, default: '520px' },
            showClose: { type: Boolean, default: true }
        },
        emits: ['update:modelValue'],
        template: `
            <teleport to="body">
                <div v-if="modelValue" class="el-overlay" @click="$emit('update:modelValue', false)"></div>
                <section v-if="modelValue" class="el-dialog" :style="{ width }">
                    <header class="el-dialog__header">
                        <button v-if="showClose" class="el-dialog__close" type="button" @click="$emit('update:modelValue', false)">×</button>
                        <span class="el-dialog__title">{{ title }}</span>
                    </header>
                    <main class="el-dialog__body"><slot /></main>
                    <footer v-if="$slots.footer" class="el-dialog__footer"><slot name="footer" /></footer>
                </section>
            </teleport>
        `
    };

    function showMessage(message) {
        const el = document.createElement('div');
        el.className = 'el-message';
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2400);
    }

    window.ElementPlus = {
        install(app) {
            app.component('ElIcon', ElIcon);
            app.component('ElButton', ElButton);
            app.component('ElInput', ElInput);
            app.component('ElMenu', ElMenu);
            app.component('ElMenuItemGroup', ElMenuItemGroup);
            app.component('ElMenuItem', ElMenuItem);
            app.component('ElDrawer', ElDrawer);
            app.component('ElDialog', ElDialog);
        },
        ElMessage: {
            success: showMessage,
            error: showMessage
        },
        ElMessageBox: {
            prompt(message) {
                const value = window.prompt(message);
                return value == null ? Promise.reject(new Error('cancel')) : Promise.resolve({ value });
            }
        }
    };
})();
