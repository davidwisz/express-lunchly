/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes}) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    // this.count = count;   set count=o in params. For purposes of seeing clearly our topten
  }

  get count() {
    return this._count;
  }

  set count(val) {
    //some logic
    this._count = ': '+ val;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  static async search(name) {
    //Determine if user input a single name or a full name
    let firstName, lastName, names;
    if (name.includes(" ")) {
      names = name.split(" ");
      firstName = names[0];
      lastName = names[1];
    } else {
      firstName = name;
      lastName = name;
    }

    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE last_name ILIKE $1 OR first_name ILIKE $2 ORDER BY last_name, first_name`,
      [lastName, firstName]
    );
    
    //Handle if user input fullname --> resets results.rows to just have the single match
    for (let i = 0; i < results.rows.length; i++) {
      let c = results.rows[i];
      if (c.firstName.toLowerCase() === firstName.toLowerCase() && c.lastName.toLowerCase() === lastName.toLowerCase()) {
        results.rows = [c];
        break;
      }
    }
    
    return results.rows.map(c => new Customer(c));
  }

  static async topTen() {
    const results = await db.query(
      `SELECT c.id, 
      c.first_name AS "firstName",  
      c.last_name AS "lastName", 
      c.phone, 
      c.notes, COUNT(*) as count
      FROM customers as c
      JOIN reservations as r
      ON c.id=r.customer_id
      GROUP BY c.id
      ORDER BY count DESC
      LIMIT 10`
    )

    return results.rows.map(c => { 
      let newC = new Customer(c);
      newC.count = c.count;
      return newC;
      });
  }
}

module.exports = Customer;
