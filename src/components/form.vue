<script setup lang="ts">
export type FormFieldType = 'input' | 'select' | 'textarea' | 'datetime' | 'number';

export interface FormOption {
  label: string;
  value: string | number | boolean;
}

export interface FormSchemaField {
  key: string;
  label: string;
  type?: FormFieldType;
  placeholder?: string;
  options?: FormOption[];
  rows?: number;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  formatter?: (value: unknown, field: FormSchemaField) => string;
}

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, string | number | boolean | null | undefined>;
    fields: FormSchemaField[];
    submitText?: string;
    cancelText?: string;
    showActions?: boolean;
    loading?: boolean;
    readonly?: boolean;
  }>(),
  {
    submitText: '保存',
    cancelText: '取消',
    showActions: true,
    loading: false,
    readonly: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string | number | boolean | null | undefined>];
  submit: [value: Record<string, string | number | boolean | null | undefined>];
  cancel: [];
}>();

function updateField(key: string, value: string | number | boolean | null) {
  if (props.readonly) return;
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}

function handleSubmit() {
  emit('submit', props.modelValue);
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function formatDisplayValue(field: FormSchemaField) {
  const value = props.modelValue[field.key];
  if (field.formatter) return field.formatter(value, field);
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'select') {
    return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value);
  }
  if (field.type === 'datetime') {
    return String(value).replace('T', ' ');
  }
  if (field.type === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  return String(value);
}
</script>

<template>
  <form class="form-card" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div v-for="field in fields" :key="field.key" class="field">
        <label :for="field.key">
          {{ field.label }}
          <span v-if="field.required" class="field__required">*</span>
        </label>

        <template v-if="readonly || field.readonly">
          <div class="field__readonly">{{ formatDisplayValue(field) }}</div>
        </template>

        <input
          v-else-if="!field.type || field.type === 'input' || field.type === 'datetime' || field.type === 'number'"
          :id="field.key"
          :value="modelValue[field.key] ?? field.defaultValue ?? ''"
          :type="field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          @input="updateField(field.key, field.type === 'number' ? (($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value)) : ($event.target as HTMLInputElement).value)"
        />

        <select
          v-else-if="field.type === 'select'"
          :id="field.key"
          :value="modelValue[field.key] ?? field.defaultValue ?? ''"
          :disabled="field.disabled"
          @change="updateField(field.key, ($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>{{ field.placeholder || '请选择' }}</option>
          <option v-for="option in field.options || []" :key="String(option.value)" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <textarea
          v-else-if="field.type === 'textarea'"
          :id="field.key"
          :rows="field.rows || 4"
          :value="modelValue[field.key] ?? field.defaultValue ?? ''"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>

    <div v-if="showActions && !(readonly)" class="form-actions">
      <button type="submit" class="button button--primary" :disabled="loading">
        {{ loading ? '保存中…' : submitText }}
      </button>
      <button type="button" class="button button--secondary" @click="emit('cancel')">{{ cancelText }}</button>
    </div>
  </form>
</template>

<style scoped>
.form-card { width: 100%; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.field label { display: block; margin-bottom: 6px; color: #94a3b8; font-size: 14px; }
.field__required { color: #fca5a5; margin-left: 4px; }
.field input,.field select,.field textarea,.field__readonly { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.22); background: rgba(30, 41, 59, 0.65); color: #e5eefc; }
.field__readonly { min-height: 46px; display: flex; align-items: center; }
.field textarea { min-height: 120px; resize: vertical; }
.field input::placeholder,.field textarea::placeholder,.field select:invalid { color: rgba(148, 163, 184, 0.55); }
.field input:focus,.field select:focus,.field textarea:focus { border-color: rgba(129, 140, 248, 0.55); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
