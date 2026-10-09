import { createOrder } from './gen/tag/createOrder.ts'

const order = createOrder({ quantity: 2, complete: true })
order.complete = false
order.complete = true
