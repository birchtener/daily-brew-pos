import { apiClient } from "./client";
import { type Category } from "./categories";
import { type Ingredient, type Unit } from "./ingredients";

export type RecipeItem = {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
  unit: Unit;
  created_at: string;
  updated_at: string;
  ingredient: Ingredient;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  img_path: string | null;
  category_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  category: Category;
  recipes?: RecipeItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function getProducts() {
  const { data } = await apiClient.get<ApiResponse<Product[]>>(
    "/inventory/products",
  );
  return data.data;
}

export async function getProduct(id: string) {
  const { data } = await apiClient.get<ApiResponse<Product>>(
    `/inventory/products/${id}`,
  );
  return data.data;
}

export async function createProduct(payload: {
  name: string;
  price: number;
  category_id: string;
  image?: File | null;
  ingredients: { ingredient_id: string; quantity: number; unit: Unit }[];
}) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("price", String(payload.price));
  formData.append("category_id", payload.category_id);

  if (payload.image) {
    formData.append("image", payload.image);
  }

  formData.append("ingredients", JSON.stringify(payload.ingredients));

  const { data } = await apiClient.post<ApiResponse<Product>>(
    "/inventory/products",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.data;
}

export async function updateProduct(
  id: string,
  payload: {
    name?: string;
    price?: number;
    category_id?: string;
    image?: File | null;
    img_path?: string | null;
    ingredients?: { ingredient_id: string; quantity: number; unit: Unit }[];
  },
) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.price !== undefined)
    formData.append("price", String(payload.price));
  if (payload.category_id !== undefined)
    formData.append("category_id", payload.category_id);

  if (payload.image) {
    formData.append("image", payload.image);
  }
  if (payload.img_path !== undefined) {
    formData.append(
      "img_path",
      payload.img_path === null ? "null" : payload.img_path,
    );
  }
  if (payload.ingredients !== undefined) {
    formData.append("ingredients", JSON.stringify(payload.ingredients));
  }

  const { data } = await apiClient.patch<ApiResponse<Product>>(
    `/inventory/products/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.data;
}

export async function deleteProduct(id: string) {
  const { data } = await apiClient.delete<ApiResponse<Product>>(
    `/inventory/products/${id}`,
  );
  return data.data;
}
