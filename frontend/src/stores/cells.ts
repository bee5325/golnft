export const useCells = (_cells: boolean[][]) => {
  let cells = ref<boolean[][]>(_cells);
  return cells;
}
