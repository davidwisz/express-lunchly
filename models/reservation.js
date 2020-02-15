/** Reservation for Lunchly */
const ExpressError = require("../expressError");
const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (val < 1) {
      console.log('val:', val)
      throw new ExpressError('WRONG!', 400)
    }
    else {
      this._numGuests = val;
    }
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(val) {
    try {
      this._startAt = new Date(val)
      console.log(typeof this._startAt)
      if (this._startAt === 'Invalid Date') {
        throw new ExpressError('WRONG DATE FORMAT!', 400);
      }
    }
    catch(err) {
      return err
    }
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET customer_id=$1, num_guests=$2, start_at=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
