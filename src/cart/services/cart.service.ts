import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import { Cart } from '../models';
import { Client } from 'pg';

const cartId = '632c1082-0216-4c4c-9b32-bdffcb942fcd';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;
const dbOptions = {
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DATABASE,
    user: PG_USERNAME,
    password: PG_PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
};


@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  async findByUserId(userId: string): Promise<{cart: Cart, items: any}> {
    const client = new Client(dbOptions);
    await client.connect();

    const cartQuery = {
      text: 'SELECT * FROM carts WHERE id = $1',
      values: [cartId],
    };
  
    const cart = await client.query(cartQuery);
    const itemsQuery = {
      text: `SELECT *
        FROM cart_items JOIN products ON cart_items.product_id = products.id
        WHERE cart_id = $1
      `,
      values: [cartId],
    };
    const items = await client.query(itemsQuery);

    return {
      cart: cart.rows[0],
      items: items.rows,
    };
  }

  createByUserId(userId: string) {
    const id = v4(v4());
    const userCart = {
      id,
      items: [],
    };

    this.userCarts[ userId ] = userCart;

    return userCart;
  }

  findOrCreateByUserId(userId: string): Cart {
    const userCart = this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, body: any): Promise<any> {
    const client = new Client(dbOptions);
    await client.connect();

    const findQuery = {
      text: 'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      values: [cartId, body.product.product_id],
    };
  
    const item = await client.query(findQuery);

    if (item.rows.length) {
      const updateQuery = {
        text: `UPDATE cart_items
          SET count = $3
          WHERE cart_id = $1 AND product_id = $2
          RETURNING *
          `,
        values: [cartId, body.product.product_id, body.count],
      };
    
      const updatedCart = await client.query(updateQuery);

      return updatedCart.rows;
    }

    const query = {
      text: `insert into cart_items (cart_id, product_id, count) values
      ($1, $2, $3)
      `,
      values: [cartId, body.product.product_id, body.count],
    };

    const updatedCart = await client.query(query);

    return { ...updatedCart };
  }

  removeByUserId(userId): void {
    this.userCarts[ userId ] = null;
  }

}
