<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

type WorkOrderRow = {
  id: string;
  project: string;
  overtime: boolean;
  hours: number;
  created_at: string;
};

const props = defineProps<{
  rows: WorkOrderRow[];
}>();

const barChartRef = ref<HTMLDivElement | null>(null);
const donutChartRef = ref<HTMLDivElement | null>(null);
let barChartInstance: echarts.ECharts | null = null;
let donutChartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const roundHours = (value: number) => Number(value.toFixed(1));
const chartColors = ['#38bdf8', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7', '#06b6d4'];

const chartData = computed(() => {
  const grouped = new Map<string, number>();

  for (const row of props.rows) {
    const key = row.project?.trim() || '未命名项目';
    grouped.set(key, (grouped.get(key) ?? 0) + (Number(row.hours) || 0));
  }

  return Array.from(grouped.entries())
    .map(([project, hours]) => ({ project, hours: roundHours(hours) }))
    .sort((a, b) => b.hours - a.hours);
});

const chartTotal = computed(() => chartData.value.reduce((sum, item) => sum + item.hours, 0));

function renderBarChart() {
  if (!barChartRef.value) return;

  if (!barChartInstance) {
    barChartInstance = echarts.init(barChartRef.value);
  }

  const projects = chartData.value.map((item) => item.project);
  const barData = chartData.value.map((item, index) => ({
    value: item.hours,
    itemStyle: {
      color: chartColors[index % chartColors.length],
    },
  }));

  barChartInstance.setOption({
    backgroundColor: 'transparent',
    title: {
      text: 'Project Hours Distribution',
      left: 'center',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 20,
        fontWeight: 600,
      },
    },
    grid: {
      left: 20,
      right: 60,
      top: 60,
      bottom: 10,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: unknown) => `${Number(value ?? 0).toFixed(1)} 小时`,
    },
    xAxis: {
      type: 'value',
      name: 'Hours',
      axisLabel: {
        color: '#94a3b8',
        formatter: (value: number) => `${Number(value).toFixed(1)}`,
      },
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.14)' } },
    },
    yAxis: {
      type: 'category',
      data: projects,
      axisLabel: { color: '#cbd5e1' },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.28)' } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: barData,
        barWidth: 18,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#e2e8f0',
          formatter: (params: { value: number }) => `${Number(params.value).toFixed(1)} 小时`,
        },
      },
    ],
  });

  barChartInstance.resize();
}

function renderDonutChart() {
  if (!donutChartRef.value) return;

  if (!donutChartInstance) {
    donutChartInstance = echarts.init(donutChartRef.value);
  }

  const data = chartData.value.map((item, index) => ({
    name: item.project,
    value: item.hours,
    itemStyle: {
      color: chartColors[index % chartColors.length],
    },
  }));

  donutChartInstance.setOption({
    backgroundColor: 'transparent',
    title: {
      text: 'Hours Percentage',
      left: 'center',
      top: 14,
      textStyle: {
        color: '#e2e8f0',
        fontSize: 20,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}<br/>${Number(params.value).toFixed(1)} 小时（${params.percent}%）`,
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 50,
      bottom: 20,
      textStyle: {
        color: '#cbd5e1',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['38%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(15, 23, 42, 0.92)',
          borderWidth: 3,
        },
        label: {
          color: '#e2e8f0',
          formatter: '{b}\n{d}%',
        },
        labelLine: {
          length: 12,
          length2: 10,
        },
        data,
      },
    ],
  });

  donutChartInstance.resize();
}

function resizeCharts() {
  barChartInstance?.resize();
  donutChartInstance?.resize();
}

async function renderCharts() {
  await nextTick();
  renderBarChart();
  renderDonutChart();
  resizeCharts();
}

onMounted(() => {
  renderCharts();
  window.addEventListener('resize', resizeCharts);

  if (typeof ResizeObserver !== 'undefined' && barChartRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCharts());
    resizeObserver.observe(barChartRef.value);
    if (donutChartRef.value) {
      resizeObserver.observe(donutChartRef.value);
    }
  }
});

watch(
  () => props.rows,
  () => renderCharts(),
  { deep: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  resizeObserver?.disconnect();
  resizeObserver = null;
  barChartInstance?.dispose();
  donutChartInstance?.dispose();
  barChartInstance = null;
  donutChartInstance = null;
});
</script>

<template>
  <div class="project-hours-chart">
    <div ref="barChartRef" class="project-hours-chart__bar" />
    <div ref="donutChartRef" class="project-hours-chart__donut" />
  </div>
</template>

<style scoped>
.project-hours-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
  max-height: 300px;
  display: flex;
  gap: 16px;
  box-sizing: border-box;
}

.project-hours-chart__bar,
.project-hours-chart__donut {
  height: 100%;
  min-height: 300px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-sizing: border-box;
}

.project-hours-chart__bar {
  flex: 65 1 0;
}

.project-hours-chart__donut {
  flex: 35 1 0;
}
</style>
