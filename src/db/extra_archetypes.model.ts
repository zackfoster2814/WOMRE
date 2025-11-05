import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import lodash from "lodash";
import { ExtraArchetypeTables } from "./tables/extra_archetypes.js";

const isEmpty = lodash.isEmpty;
const ExtraArchetypes = ExtraArchetypeTables(db.sequelize, db.dataTypes);

export const getAllExtraArchetypes = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraArchetypes.findAll()
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

export const getExtraArchetypeById = async function (id: number): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraArchetypes.findOne({
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

export const createExtraArchetype = async function (data: any): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraArchetypes.create(data)
      .then(function (obj: any) {
        resolve(obj);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

export const updateExtraArchetype = async function (id: number, data: any): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraArchetypes.update(data, {
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

export const deleteExtraArchetype = async function (id: number): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    ExtraArchetypes.destroy({
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