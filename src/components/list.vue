<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export interface ListSchemaColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown, row: Record<string, unknown>, index: number) => string | number;
  render?: (row: Record<string, unknown>, index: number) => string | number;
}

export interface ListSchemaAction {
  key: 'view' | 'edit' | 'delete' | string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  confirm?: boolean;
  show?: (row: Record<string, unknown>, index: number) => boolean;
}

const props = withDefaults(
  defineProps<{
    columns: ListSchemaColumn[];
    rows: Record<string, unknown>[];
    actions?: ListSchemaAction[];
    emptyText?: string;
    showActions?: boolean;
    addText?: string;
    actionWidth?: string;
    pageSize?: number;
  }>(),
  {
    actions: () => [
      { key: 'view', label: '查看', variant: 'secondary' },
      { key: 'edit', label: '编辑', variant: 'secondary' },
      { key: 'delete', label: '删除', variant: 'danger' },
    ],
    emptyText: '暂无数据',
    showActions: true,
    addText: '添加',
    actionWidth: '260px',
    pageSize: 20,
  },
);

const emit = defineEmits<{
  add: [];
  action: [key: string, row: Record<string, unknown>, index: number];
}>();

const currentPage = ref(1);

const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / props.pageSize)));

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return props.rows.slice(start, start + props.pageSize);
});

const startIndex = computed(() => (currentPage.value - 1) * props.pageSize);

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const pages: number[] = [];

  for (let page = 1; page <= total; page += 1) {
    pages.push(page);
  }

  return pages;
});

watch(
  () => props.rows.length,
  () => {
    currentPage.value = Math.min(currentPage.value, totalPages.value);
  },
  { immediate: true },
);

function getCellValue(column: ListSchemaColumn, row: Record<string, unknown>, index: number) {
  if (column.render) return column.render(row, index);
  if (column.formatter) return column.formatter(row[column.key], row, index);
  return (row[column.key] as string | number | undefined) ?? '';
}

function setPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value);
}
</script>

<template>
  <div class="list-card">
    <div class="list-card__header">
      <div class="list-card__title">
        <slot name="title" />
      </div>
      <button v-if="showActions" type="button" class="button button--primary list-card__add" @click="emit('add')">
        {{ addText }}
      </button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="column.width ? { width: column.width } : undefined"
              :class="[`is-${column.align || 'left'}`]"
            >
              {{ column.label }}
            </th>
            <th v-if="showActions" class="is-center table__actions-col" :style="{ width: actionWidth }">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!pagedRows.length">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="table__empty">{{ emptyText }}</td>
          </tr>
          <tr v-for="(row, index) in pagedRows" v-else :key="startIndex + index">
            <td v-for="column in columns" :key="column.key" :class="[`is-${column.align || 'left'}`]">
              <slot :name="column.key" :row="row" :index="startIndex + index">
                {{ getCellValue(column, row, startIndex + index) }}
              </slot>
            </td>
            <td v-if="showActions" class="is-center table__actions" :style="{ width: actionWidth }">
              <button
                v-for="action in actions"
                v-show="!action.show || action.show(row, startIndex + index)"
                :key="action.key"
                type="button"
                class="button table__action"
                :class="[`button--${action.variant || 'secondary'}`, action.variant === 'danger' ? 'table__action--danger' : '']"
                @click="emit('action', action.key, row, startIndex + index)"
              >
                {{ action.label }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="list-card__footer">
      <div class="list-card__pagination-info">
        第 {{ currentPage }} / {{ totalPages }} 页，共 {{ props.rows.length }} 条
      </div>
      <div class="list-card__pagination-actions">
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="button button--secondary list-card__page-button"
          :class="{ 'is-active': page === currentPage }"
          @click="setPage(page)"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-card {
  width: 100%;
  height: 100%;
  min-height: 520px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.list-card__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex: 0 0 auto; }
.list-card__title { min-height: 1px; }
.list-card__add {
  flex: 0 0 auto;
  height: 40px;
  padding: 5px 10px;
  line-height: 1;
}

.table-wrap {
  width: 100%;
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
}
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}
th,td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  color: #e2e8f0;
  line-height: 1.2;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 16px;
  color: #94a3b8;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.98);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}
.table tbody tr {
  height: 48px;
}
.is-left { text-align: left; }
.is-center { text-align: center; }
.is-right { text-align: right; }
.table__actions-col {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
}
.table__actions {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  white-space: nowrap;
}
.table__action {
  margin: 0 6px;
  min-width: 72px;
  height: 30px;
  padding: 0 12px;
}
.table__action--danger { border-color: rgba(248, 113, 113, 0.35); color: #fca5a5; }
.table__empty { text-align: center; color: #94a3b8; }
.list-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
  flex: 0 0 auto;
}
.list-card__pagination-info {
  color: #94a3b8;
  font-size: 13px;
}
.list-card__pagination-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.list-card__page-button {
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1;
}
.list-card__page-button.is-active {
  border-color: rgba(56, 189, 248, 0.55);
  background: rgba(56, 189, 248, 0.16);
  color: #e0f2fe;
}

.table-wrap::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.table-wrap::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 999px;
}

.table-wrap::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.45), rgba(139, 92, 246, 0.45));
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.45);
}

.table-wrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.65), rgba(139, 92, 246, 0.65));
}

.table-wrap {
  scrollbar-width: thin;
  scrollbar-color: rgba(56, 189, 248, 0.55) rgba(15, 23, 42, 0.45);
}
</style>
