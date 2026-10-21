export type ResourceType = 'Chair' | 'Room' | 'Station' | 'Equipment'

export type Resource = {
  id: string
  name: string
  type: ResourceType
  branchId: string
  /** Service categories or ids that need this place. */
  serviceIds: string[]
  note?: string
}

export const RESOURCES: Resource[] = [
  { id: 'r1', name: 'Chair 1', type: 'Chair', branchId: 'b1', serviceIds: ['v1', 'v2', 'v3', 'v4'] },
  { id: 'r2', name: 'Chair 2', type: 'Chair', branchId: 'b1', serviceIds: ['v1', 'v2', 'v3', 'v4'] },
  { id: 'r3', name: 'Nail desk', type: 'Station', branchId: 'b1', serviceIds: ['v5', 'v6', 'v7'] },
  { id: 'r4', name: 'Cosmetology room', type: 'Room', branchId: 'b1', serviceIds: ['v11', 'v12', 'v13'] },
  { id: 'r5', name: 'Brow & lash station', type: 'Station', branchId: 'b1', serviceIds: ['v8', 'v9', 'v10'] },
  { id: 'r6', name: 'Barber chair', type: 'Chair', branchId: 'b2', serviceIds: ['v14', 'v15', 'v16'] },
  { id: 'r7', name: 'Massage room', type: 'Room', branchId: 'b1', serviceIds: ['v17', 'v18'] },
  { id: 'r8', name: 'Laser device', type: 'Equipment', branchId: 'b1', serviceIds: ['v12'], note: 'Moves between rooms' },
]
