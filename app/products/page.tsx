"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { addCategory, getCategories, addProduct, getProducts, checkAndAddUser, deleteCategory, deleteProduct, updateCategory, updateProduct } from "../actions";
import Wrapper from "../components/Wrapper";
import { Plus, FolderOpen, Package, Trash, Edit } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  categoryId: string | null;
  category?: Category | null;
}

export default function ProductsPage() {
  const { user, isLoaded } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // États pour les formulaires
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    description: "", 
    unitPrice: 0, 
    categoryId: "" 
  });

  // Ajout des états pour l'édition
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState({ name: "", description: "" });
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState({ name: "", description: "", unitPrice: 0, categoryId: "" });

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  // Charger les données
  const loadData = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      // S'assurer que l'utilisateur existe dans la base de données locale
      const userName = user?.fullName || user?.firstName || "Utilisateur";
      await checkAndAddUser(userEmail, userName);
      
      const [categoriesData, productsData] = await Promise.all([
        getCategories(userEmail),
        getProducts(userEmail)
      ]);
      
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
  }, [userEmail, user?.fullName, user?.firstName]);

  useEffect(() => {
    if (isLoaded && userEmail) {
      loadData();
    }
  }, [isLoaded, userEmail, loadData]);

  // Ajouter une catégorie
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    const success = await addCategory(userEmail, newCategory.name, newCategory.description);
    if (success) {
      setNewCategory({ name: "", description: "" });
      loadData();
    }
  };

  // Ajouter un produit
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || newProduct.unitPrice <= 0) return;
    
    const success = await addProduct(
      userEmail, 
      newProduct.name, 
      newProduct.unitPrice, 
      newProduct.categoryId || undefined, 
      newProduct.description
    );
    
    if (success) {
      setNewProduct({ name: "", description: "", unitPrice: 0, categoryId: "" });
      loadData();
    }
  };

  // Handler suppression catégorie
  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    const success = await deleteCategory(userEmail, categoryId);
    if (success) loadData();
  };

  // Handler suppression produit
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Supprimer ce produit/service ?")) return;
    const success = await deleteProduct(userEmail, productId);
    if (success) loadData();
  };

  // Handler édition catégorie
  const startEditCategory = (category: Category) => {
    setEditCategoryId(category.id);
    setEditCategory({ name: category.name, description: category.description || "" });
  };

  const handleUpdateCategory = async (categoryId: string) => {
    const success = await updateCategory(userEmail, categoryId, editCategory.name, editCategory.description);
    if (success) {
      setEditCategoryId(null);
      loadData();
    }
  };

  // Handler édition produit
  const startEditProduct = (product: Product) => {
    setEditProductId(product.id);
    setEditProduct({ name: product.name, description: product.description || "", unitPrice: product.unitPrice, categoryId: product.categoryId || "" });
  };

  const handleUpdateProduct = async (productId: string) => {
    const success = await updateProduct(userEmail, productId, editProduct.name, editProduct.unitPrice, editProduct.categoryId || undefined, editProduct.description);
    if (success) {
      setEditProductId(null);
      loadData();
    }
  };

  if (!isLoaded) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gestion des Produits</h1>

        {/* Section Catégories */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <FolderOpen className="w-5 h-5" />
              Catégories
            </h2>
            
            {/* Formulaire d'ajout de catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Nom de la catégorie"
                className="input input-bordered"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                className="input input-bordered"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
              <button
                className="btn btn-accent"
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim()}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Liste des catégories */}
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      {editCategoryId === category.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm"
                              value={editCategory.name}
                              onChange={e => setEditCategory({ ...editCategory, name: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm"
                              value={editCategory.description}
                              onChange={e => setEditCategory({ ...editCategory, description: e.target.value })}
                            />
                          </td>
                          <td>
                            <button className="btn btn-sm btn-accent mr-2" onClick={() => handleUpdateCategory(category.id)}>Valider</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditCategoryId(null)}>Annuler</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium">{category.name}</td>
                          <td>{category.description || "-"}</td>
                          <td>
                            <button className="btn btn-sm btn-ghost" onClick={() => startEditCategory(category)}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section Produits */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Package className="w-5 h-5" />
              Produits
            </h2>
            
            {/* Formulaire d'ajout de produit */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <input
                type="text"
                placeholder="Nom du produit"
                className="input input-bordered"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                className="input input-bordered"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Prix unitaire"
                className="input input-bordered"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
              <select
                className="select select-bordered"
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-accent"
                onClick={handleAddProduct}
                disabled={!newProduct.name.trim() || newProduct.unitPrice <= 0}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Liste des produits */}
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Prix unitaire</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      {editProductId === product.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm"
                              value={editProduct.name}
                              onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm"
                              value={editProduct.description}
                              onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input input-bordered input-sm"
                              value={editProduct.unitPrice}
                              min={0}
                              step={0.01}
                              onChange={e => setEditProduct({ ...editProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                            />
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-sm"
                              value={editProduct.categoryId}
                              onChange={e => setEditProduct({ ...editProduct, categoryId: e.target.value })}
                            >
                              <option value="">Aucune catégorie</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-accent mr-2" onClick={() => handleUpdateProduct(product.id)}>Valider</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditProductId(null)}>Annuler</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium">{product.name}</td>
                          <td>{product.description || "-"}</td>
                          <td>{product.unitPrice.toFixed(2)} Fcfa</td>
                          <td>{product.category?.name || "-"}</td>
                          <td>
                            <button className="btn btn-sm btn-ghost" onClick={() => startEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
} 