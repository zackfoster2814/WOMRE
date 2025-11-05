import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import lodash from "lodash";
import { ExtraHouseTables } from "./tables/extra_house.js";

const isEmpty = lodash.isEmpty;
const ExtraHouses = ExtraHouseTables(db.sequelize, db.dataTypes);

export const getAllExtraHouses = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraHouses.findAll()
      .then(function (obj: any) {
        if (!isEmpty(obj)) {
          resolve(obj);
        } else {
          resolve(null);
        }
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

export const getExtraHouseById = async function (id: number): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraHouses.findOne({
      where: { id: id }
    })
      .then(function (obj: any) {
        if (!isEmpty(obj)) {
          resolve(obj);
        } else {
          resolve(null);
        }
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

export const createExtraHouse = async function (data: any): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraHouses.create(data)
      .then(function (obj: any) {
        resolve(obj);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

export const updateExtraHouse = async function (id: number, data: any): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraHouses.update(data, {
      where: { id: id }
    })
      .then(function (obj: any) {
        resolve(obj);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

export const deleteExtraHouse = async function (id: number): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraHouses.destroy({
      where: { id: id }
    })
      .then(function () {
        resolve(true);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};
