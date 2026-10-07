/** Initial conditions, not live simulation readings. Normalized positions are 0..1.
 * Background trees/grass remain decorative placeholders. These records are
 * separately rendered in the organism layer. Do not count inventory as diversity.
 */
export const forestDefinition = {
  id: 'forest', name: '나의 숲', environmentLabel: '맑은 숲',
  abiotic: {
    sunlight: { value: 1 },
    water: { value: 1 },
    air: { value: 1 },
    soil: { value: 1 },
  },
  initialOrganisms: [
    { instanceId: 'oak-01', speciesId: 'oak', position: { x: 0.25, y: 0.72 } },
    { instanceId: 'oak-02', speciesId: 'oak', position: { x: 0.56, y: 0.71 } },
    { instanceId: 'grass-01', speciesId: 'grass', position: { x: 0.46, y: 0.75 } },
  ],
  initialInventory: ['oak', 'grass', 'grasshopper'],
};
