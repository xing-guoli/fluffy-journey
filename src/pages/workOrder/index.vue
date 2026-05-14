<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Form, { type FormSchemaField } from "../../components/form.vue";
import List, { type ListSchemaAction, type ListSchemaColumn } from "../../components/list.vue";
import ProjectHoursChart from "./charts.vue";
import workOrdersJson from "./default.json";
import { authUser, clearAuthSession } from "../../stores/authSession";

type WorkOrderRow = {
  id: string;
  project: string;
  overtime: boolean;
  hours: number;
  created_at: string;
};

type WorkOrderFormState = {
  id: string;
  project: string;
  overtime: string;
  hours: number | null;
  created_at: string;
};

type WorkOrderAction = 'add' | 'edit' | 'view' | 'delete';

const router = useRouter();
const workOrders = ref<WorkOrderRow[]>(workOrdersJson as WorkOrderRow[]);
const dialogVisible = ref(false);
const dialogMode = ref<WorkOrderAction>('add');
const deleteTarget = ref<WorkOrderRow | null>(null);
const loading = ref(false);

const createEmptyFormValue = (): WorkOrderFormState => ({
  id: '',
  project: '',
  overtime: 'false',
  hours: null,
  created_at: '',
});

function generateWorkOrderId() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WO${timestamp}${random}`;
}

const formValue = ref<WorkOrderFormState>(createEmptyFormValue());

const listColumns: ListSchemaColumn[] = [
  { key: 'id', label: 'id', width: '110px' },
  { key: 'project', label: 'project', width: '240px' },
  {
    key: 'overtime',
    label: 'overtime',
    width: '120px',
    align: 'center',
    formatter: (value) => (value ? '是' : '否'),
  },
  {
    key: 'hours',
    label: 'hours',
    width: '100px',
    align: 'right',
    formatter: (value) => `${value ?? 0} 小时`,
  },
  { key: 'created_at', label: 'created_at', width: '180px' },
];

const formFields: FormSchemaField[] = [
  { key: 'id', label: '编号', type: 'input', placeholder: '系统自动生成', required: true, disabled: true },
  { key: 'project', label: '项目名称', type: 'input', placeholder: '请输入项目名称', required: true },
  {
    key: 'overtime',
    label: '是否加班',
    type: 'select',
    placeholder: '请选择是否加班',
    options: [
      { label: '是', value: 'true' },
      { label: '否', value: 'false' },
    ],
    required: true,
  },
  { key: 'hours', label: '工时', type: 'number', placeholder: '请输入工时', required: true },
  { key: 'created_at', label: '创建时间', type: 'datetime', required: true },
];

const listRows = computed(() => workOrders.value);

const canDelete = computed(() => {
  const role = authUser.value?.role;
  if (role == null || role === '') return false;

  const roleTuple = String(role)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return roleTuple.includes('admin');
});

const listActions = computed<ListSchemaAction[]>(() => [
  { key: 'view', label: '查看', variant: 'secondary' },
  { key: 'edit', 
    label: '编辑', 
    variant: 'secondary',
    show: () => canDelete.value, },
  {
    key: 'delete',
    label: '删除',
    variant: 'danger',
    show: () => canDelete.value,
  },
]);

const dialogTitle = computed(() => {
  const titles: Record<WorkOrderAction, string> = {
    add: '添加工单',
    edit: '编辑工单',
    view: '查看工单',
    delete: '删除工单',
  };
  return titles[dialogMode.value];
});

const dialogDescription = computed(() => {
  if (dialogMode.value === 'view') return '查看当前工单信息';
  return '支持添加与编辑工单信息';
});

const submitText = computed(() => (dialogMode.value === 'add' ? '创建' : '保存'));
const isReadOnly = computed(() => dialogMode.value === 'view');

function goLogin() {
  clearAuthSession();
  void router.push({ name: 'login' });
}

function openDialog(mode: WorkOrderAction, row?: WorkOrderRow) {
  dialogMode.value = mode;
  formValue.value = row
    ? {
        id: row.id,
        project: row.project,
        overtime: String(row.overtime),
        hours: row.hours,
        created_at: row.created_at.replace(' ', 'T'),
      }
    : {
        ...createEmptyFormValue(),
        id: generateWorkOrderId(),
      };
  dialogVisible.value = true;
}

function handleAdd() {
  openDialog('add');
}

function handleAction(action: string, row: Record<string, unknown>) {
  const record = row as WorkOrderRow;
  if (action === 'view') openDialog('view', record);
  if (action === 'edit') openDialog('edit', record);
  if (action === 'delete') {
    if (!canDelete.value) return;
    deleteTarget.value = record;
  }
}

function closeDialog() {
  dialogVisible.value = false;
}

function normalizeDatetime(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

function handleSubmit() {
  if (isReadOnly.value) {
    closeDialog();
    return;
  }

  loading.value = true;
  try {
    const nextRow: WorkOrderRow = {
      id: formValue.value.id.trim(),
      project: formValue.value.project.trim(),
      overtime: formValue.value.overtime === 'true',
      hours: Number(formValue.value.hours),
      created_at: normalizeDatetime(formValue.value.created_at),
    };

    if (!nextRow.id || !nextRow.project || !nextRow.created_at || Number.isNaN(nextRow.hours)) {
      return;
    }

    if (dialogMode.value === 'add') {
      workOrders.value = [nextRow, ...workOrders.value];
    } else if (dialogMode.value === 'edit') {
      workOrders.value = workOrders.value.map((item) => (item.id === nextRow.id ? nextRow : item));
    }

    closeDialog();
  } finally {
    loading.value = false;
  }
}

function confirmDelete() {
  if (!deleteTarget.value) return;
  workOrders.value = workOrders.value.filter((item) => item.id !== deleteTarget.value?.id);
  deleteTarget.value = null;
}

function cancelDelete() {
  deleteTarget.value = null;
}

onMounted(() => {
  if (!authUser.value) {
    void router.replace({ name: 'login' });
  }
});
</script>

<template>
  <main v-if="authUser" class="page page--list">
    <section class="hero hero--panel">
      <div class="hero__user-group">
        <span class="hero__label">当前用户</span>
        <span class="hero__user-name">{{ authUser.username }}</span>
      </div>
      <div class="hero__actions">
        <button type="button" class="hero__logout-button" @click="goLogin">退出登录</button>
      </div>
    </section>

    <section class="chart-section">
      <ProjectHoursChart :rows="listRows" />
    </section>

    <section class="list-section">
      <List
        :columns="listColumns"
        :rows="listRows"
        :actions="listActions"
        add-text="添加"
        @add="handleAdd"
        @action="handleAction"
      >
        <template #title>
          <div>
            <h2 class="section-title">工单列表</h2>
          </div>
        </template>
      </List>
    </section>

    <teleport to="body">
      <div v-if="dialogVisible" class="modal-mask" @click.self="closeDialog">
        <div class="modal-card">
          <div class="modal-card__header">
            <div>
              <h3>{{ dialogTitle }}</h3>
              <p>{{ dialogDescription }}</p>
            </div>
            <button type="button" class="button button--secondary" @click="closeDialog">关闭</button>
          </div>

          <Form
            v-model="formValue"
            :fields="formFields"
            :submit-text="submitText"
            :show-actions="true"
            :loading="loading"
            :readonly="isReadOnly"
            @submit="handleSubmit"
            @cancel="closeDialog"
          />
        </div>
      </div>

      <div v-if="deleteTarget" class="modal-mask" @click.self="cancelDelete">
        <div class="modal-card modal-card--confirm">
          <h3>确认删除</h3>
          <p>确定删除工单 <strong>{{ deleteTarget.id }}</strong> 吗？此操作不可恢复。</p>
          <div class="modal-card__footer modal-card__footer--end">
            <button type="button" class="button button--secondary" @click="cancelDelete">取消</button>
            <button type="button" class="button button--primary button--danger" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.page--list {
  display: grid;
  gap: 5px;
}

.hero--panel {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 12px 0;
  border-radius: 16px;
  background: none;
  border: none;
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.hero__user-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
  min-width: 0;
  color: #cbd5e1;
}

.hero__label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  line-height: 1;
}

.hero__user-name {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  line-height: 1;
}

.hero__logout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 36px;
  padding: 0 16px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(248, 113, 113, 0.18), rgba(239, 68, 68, 0.14));
  color: #fecaca;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.hero__logout-button:hover {
  transform: translateY(-1px);
  background: linear-gradient(180deg, rgba(248, 113, 113, 0.26), rgba(239, 68, 68, 0.2));
  box-shadow: 0 8px 18px rgba(239, 68, 68, 0.2);
}

.hero__logout-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.chart-section {
  width: 100%;
  min-height: 260px;
  max-height: 300px;
  overflow: hidden;
}

.list-section {
  width: 100%;
  min-height: 500px;
  max-height: 1000px;
  overflow: hidden;
}

.chart-section {
  display: flex;
}

.list-section {
  display: flex;
}

.section-title {
  margin: 0;
  font-size: 20px;
  color: #e2e8f0;
}

.modal-mask { position: fixed; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(2, 6, 23, 0.72); backdrop-filter: blur(6px); z-index: 50; }
.modal-card { width: min(100%, 720px); max-height: 90vh; overflow: auto; padding: 24px; border-radius: 20px; background: rgba(15, 23, 42, 0.98); border: 1px solid rgba(148, 163, 184, 0.16); box-shadow: 0 24px 80px rgba(15, 23, 42, 0.45); }
.modal-card--confirm { width: min(100%, 460px); }
.modal-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.modal-card__header h3, .modal-card h3 { margin: 0; color: #e2e8f0; }
.modal-card__header p, .modal-card p { margin: 8px 0 0; color: #94a3b8; }
.modal-card__footer { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
.modal-card__footer--end { justify-content: flex-end; }
</style>
