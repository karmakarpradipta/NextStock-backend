import * as categoryService from "./category.service.js";

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) { next(err); }
};