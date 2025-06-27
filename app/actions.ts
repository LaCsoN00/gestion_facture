"use server"

import prisma from "../lib/prisma";
import { Invoice, InvoiceLine } from "../type";
import { Prisma } from "@prisma/client";

// Fonction de test pour diagnostiquer les problèmes de dates
export async function debugInvoiceStatus(invoiceId: string): Promise<void> {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { lines: true }
        });
        
        if (!invoice) {
            console.error(`Facture ${invoiceId} non trouvée`);
            return;
        }
        
        console.log("🔍 DIAGNOSTIC DE LA FACTURE:");
        console.log(`ID: ${invoice.id}`);
        console.log(`Statut: ${invoice.status}`);
        console.log(`Date d'échéance brute: "${invoice.dueDate}"`);
        console.log(`Type de date d'échéance: ${typeof invoice.dueDate}`);
        
        if (invoice.dueDate) {
            const dueDate = new Date(invoice.dueDate);
            console.log(`Date d'échéance parsée: ${dueDate.toISOString()}`);
            console.log(`Date d'échéance valide: ${!isNaN(dueDate.getTime())}`);
            
            const today = new Date();
            console.log(`Date actuelle: ${today.toISOString()}`);
            console.log(`Échéance dépassée: ${dueDate < today}`);
            console.log(`Statut = "En attente": ${invoice.status === 2}`);
            console.log(`Doit être mise à jour: ${dueDate < today && invoice.status === 2}`);
        }
    } catch (error) {
        console.error("Erreur lors du diagnostic:", error);
    }
}

// Fonction utilitaire pour vérifier et mettre à jour le statut d'une facture
async function checkAndUpdateInvoiceStatus(invoice: Invoice): Promise<Invoice> {
    if (!invoice.dueDate || invoice.dueDate === "") {
        return invoice;
    }
    
    try {
        const dueDate = new Date(invoice.dueDate);
        if (isNaN(dueDate.getTime())) {
            return invoice;
        }
        
        const today = new Date();
        // On ignore l'heure pour la comparaison (on ne garde que la date)
        today.setHours(0,0,0,0);
        dueDate.setHours(0,0,0,0);
        
        // Vérifier si la facture est complète (a des informations de base)
        const isComplete = invoice.issuerName && invoice.clientName && invoice.lines.length > 0;
        
        let newStatus = invoice.status;
        
        // Si la facture est complète et en brouillon, passer en "En attente"
        if (isComplete && invoice.status === 1) {
            newStatus = 2;
        }
        // Si la facture est en attente et l'échéance est dépassée, passer en "Impayé"
        if (newStatus === 2 && dueDate < today) {
            newStatus = 5;
        }
        // Si la facture est impayée et que la date d'échéance est repoussée (future), repasser en attente
        if (newStatus === 5 && dueDate >= today) {
            newStatus = 2;
        }
        // On ne change pas le statut si la facture est payée ou annulée
        if (invoice.status === 3 || invoice.status === 4) {
            newStatus = invoice.status;
        }
        // Si le statut a changé, mettre à jour en base
        if (newStatus !== invoice.status) {
            const updatedInvoice = await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: newStatus },
                include: { lines: true }
            });
            return updatedInvoice;
        }
    } catch (dateError) {
        console.error(`Erreur lors du traitement de la date pour la facture ${invoice.id}:`, dateError);
    }
    
    return invoice;
}

export async function checkAndAddUser(email: string, name: string): Promise<boolean> {
    if (!email || !name) {
        console.error("Email et nom requis pour créer un utilisateur");
        return false;
    }
    
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            // Mettre à jour le nom si nécessaire
            if (existingUser.name !== name) {
                await prisma.user.update({
                    where: { email: email },
                    data: { name: name }
                });
                console.log(`Nom utilisateur mis à jour: ${email}`);
            }
            return true;
        }

        // Créer un nouvel utilisateur
        await prisma.user.create({
            data: {
                email: email,
                name: name
            }
        });

        console.log(`Nouvel utilisateur créé: ${email}`);
        return true;
    } catch (error) {
        console.error("Erreur lors de la vérification/création de l'utilisateur:", error);
        return false;
    }
}

export async function generateUniqueId(): Promise<string> {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Vérifier si l'ID existe déjà
            const existingInvoice = await prisma.invoice.findUnique({
                where: { id: id }
            });
            
            if (!existingInvoice) {
                return id;
            }
            
            attempts++;
        } catch (error) {
            console.error("Erreur lors de la génération d'ID:", error);
            attempts++;
        }
    }
    
    // En cas d'échec, utiliser un timestamp + random
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

export async function createEmptyInvoice(email: string, name: string): Promise<string | null> {
    if (!email || !name) {
        console.error("Email et nom requis pour créer une facture");
        return null;
    }
    
    try {
        // S'assurer que l'utilisateur existe
        const userCreated = await checkAndAddUser(email, name);
        if (!userCreated) {
            console.error("Impossible de créer/vérifier l'utilisateur");
            return null;
        }
        
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            console.error("Utilisateur non trouvé après création");
            return null;
        }

        const invoiceId = await generateUniqueId();
        
        await prisma.invoice.create({
            data: {
                id: invoiceId,
                name: name,
                userId: user.id,
                issuerName: "",
                issuerAddress: "",
                clientName: "",
                clientAddress: "",
                invoiceDate: new Date().toISOString().split('T')[0], // Date du jour
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
                vatActive: false,
                vatRate: 10,
                status: 1, // Brouillon
            }
        });
        
        console.log(`Facture créée: ${invoiceId}`);
        return invoiceId;
    } catch (error) {
        console.error("Erreur lors de la création de la facture:", error);
        return null;
    }
}

export async function getInvoicesByEmail(email: string): Promise<Invoice[] | null> {
    if (!email) {
        console.error("Email requis pour récupérer les factures");
        return null;
    }
    
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {
                invoices: {
                    include: {
                        lines: {
                            include: {
                                product: {
                                    include: {
                                        category: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        if (!user) {
            console.log(`Aucun utilisateur trouvé pour l'email: ${email}`);
            return [];
        }

        // Vérifier et mettre à jour le statut de chaque facture
        const updatedInvoices = await Promise.all(
            user.invoices.map(async (invoice) => {
                return await checkAndUpdateInvoiceStatus(invoice);
            })
        );
        
        return updatedInvoices;
    } catch (error) {
        console.error("Erreur lors de la récupération des factures:", error);
        return null;
    }
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    if (!invoiceId) {
        console.error("ID de facture requis");
        return null;
    }
    
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                lines: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!invoice) {
            console.error(`Facture non trouvée avec l'ID: ${invoiceId}`);
            return null;
        }
        
        // Vérifier et mettre à jour le statut si nécessaire
        const updatedInvoice = await checkAndUpdateInvoiceStatus(invoice);
        return updatedInvoice;
    } catch (error) {
        console.error("Erreur lors de la récupération de la facture:", error);
        return null;
    }
}

type InvoiceLineWithProductId = InvoiceLine & { productId?: string };

export async function updateInvoice(invoice: Invoice): Promise<boolean> {
    if (!invoice || !invoice.id) {
        console.error("Facture invalide pour la mise à jour");
        return false;
    }
    
    try {
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: {
                lines: true
            }
        });

        if (!existingInvoice) {
            console.error(`Facture avec l'ID ${invoice.id} introuvable`);
            return false;
        }

        // Mise à jour de la facture
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                issuerName: invoice.issuerName || "",
                issuerAddress: invoice.issuerAddress || "",
                clientName: invoice.clientName || "",
                clientAddress: invoice.clientAddress || "",
                invoiceDate: invoice.invoiceDate || "",
                dueDate: invoice.dueDate || "",
                vatActive: invoice.vatActive || false,
                vatRate: invoice.vatRate || 10,
                status: invoice.status || 1,
            },
        });

        // Vérifier et mettre à jour le statut si nécessaire après la mise à jour
        const updatedInvoice = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: { lines: true }
        });
        
        if (updatedInvoice) {
            await checkAndUpdateInvoiceStatus(updatedInvoice);
        }

        const existingLines = existingInvoice.lines;
        const receivedLines = invoice.lines || [];

        // Supprimer les lignes qui ne sont plus présentes
        const linesToDelete = existingLines.filter(
            (existingLine: InvoiceLine) => !receivedLines.some((line: InvoiceLine) => line.id === existingLine.id)
        );

        if (linesToDelete.length > 0) {
            await prisma.invoiceLine.deleteMany({
                where: {
                    id: { in: linesToDelete.map((line: InvoiceLine) => line.id) }
                }
            });
        }

        // Mettre à jour ou créer les lignes
        for (const line of receivedLines as InvoiceLineWithProductId[]) {
            if (!line.description && line.quantity === 0 && line.unitPrice === 0) {
                continue; // Ignorer les lignes vides
            }
            const existingLine = existingLines.find((l: InvoiceLine) => l.id === line.id);
            if (existingLine) {
                // Mise à jour de la ligne existante
                const hasChanged =
                    line.description !== existingLine.description ||
                    line.quantity !== existingLine.quantity ||
                    line.unitPrice !== existingLine.unitPrice ||
                    line.productId !== existingLine.productId;
                if (hasChanged) {
                    await prisma.invoiceLine.update({
                        where: { id: line.id },
                        data: {
                            description: line.description || "",
                            quantity: line.quantity || 0,
                            unitPrice: line.unitPrice || 0,
                            productId: typeof line.productId === 'string' ? line.productId : undefined,
                        } as Prisma.InvoiceLineUncheckedUpdateInput
                    });
                }
            } else {
                // Création d'une nouvelle ligne
                await prisma.invoiceLine.create({
                    data: {
                        description: line.description || "",
                        quantity: line.quantity || 0,
                        unitPrice: line.unitPrice || 0,
                        productId: typeof line.productId === 'string' ? line.productId : undefined,
                        invoiceId: invoice.id
                    } as Prisma.InvoiceLineUncheckedCreateInput
                });
            }
        }

        console.log(`Facture mise à jour: ${invoice.id}`);
        return true;
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la facture:", error);
        return false;
    }
}

export async function deleteInvoice(invoiceId: string): Promise<boolean> {
    if (!invoiceId) {
        console.error("ID de facture requis pour la suppression");
        return false;
    }
    
    try {
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { lines: true }
        });

        if (!existingInvoice) {
            console.error(`Facture avec l'ID ${invoiceId} introuvable`);
            return false;
        }

        // Supprimer d'abord les lignes de la facture
        if (existingInvoice.lines.length > 0) {
            await prisma.invoiceLine.deleteMany({
                where: { invoiceId: invoiceId }
            });
        }

        // Puis supprimer la facture
        await prisma.invoice.delete({
            where: { id: invoiceId }
        });

        console.log(`Facture supprimée: ${invoiceId}`);
        return true;
    } catch (error) {
        console.error("Erreur lors de la suppression de la facture:", error);
        return false;
    }
}

// ----- CATÉGORIES -----
export async function addCategory(email: string, name: string, description = ""): Promise<boolean> {
  if (!email || !name) return false;
  try {
    // Trouver l'utilisateur local par email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      console.error(`Utilisateur non trouvé pour l'email: ${email}`);
      return false;
    }

    await prisma.category.create({
      data: { name, description, userId: user.id }
    });
    return true;
  } catch (e) {
    console.error("Erreur création catégorie:", e);
    return false;
  }
}

export async function getCategories(email: string) {
  if (!email) return [];
  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) return [];

    return prisma.category.findMany({ where: { userId: user.id } });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return [];
  }
}

// ----- PRODUITS/SERVICES -----
export async function addProduct(email: string, name: string, unitPrice: number, categoryId?: string, description = ""): Promise<boolean> {
  if (!email || !name) return false;
  try {
    // Trouver l'utilisateur local par email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      console.error(`Utilisateur non trouvé pour l'email: ${email}`);
      return false;
    }

    await prisma.product.create({
      data: { name, description, unitPrice, userId: user.id, categoryId }
    });
    return true;
  } catch (e) {
    console.error("Erreur création produit/service:", e);
    return false;
  }
}

export async function getProducts(email: string, categoryId?: string) {
  if (!email) return [];
  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) return [];

    return prisma.product.findMany({
      where: { userId: user.id, ...(categoryId ? { categoryId } : {}) },
      include: { category: true }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return [];
  }
}

export async function deleteCategory(email: string, categoryId: string): Promise<boolean> {
  if (!email || !categoryId) return false;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    await prisma.category.delete({ where: { id: categoryId, userId: user.id } });
    return true;
  } catch (e) {
    console.error('Erreur suppression catégorie:', e);
    return false;
  }
}

export async function deleteProduct(email: string, productId: string): Promise<boolean> {
  if (!email || !productId) return false;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    await prisma.product.delete({ where: { id: productId, userId: user.id } });
    return true;
  } catch (e) {
    console.error('Erreur suppression produit:', e);
    return false;
  }
}

export async function updateCategory(email: string, categoryId: string, name: string, description = ""): Promise<boolean> {
  if (!email || !categoryId || !name) return false;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    await prisma.category.update({
      where: { id: categoryId, userId: user.id },
      data: { name, description }
    });
    return true;
  } catch (e) {
    console.error('Erreur modification catégorie:', e);
    return false;
  }
}

export async function updateProduct(email: string, productId: string, name: string, unitPrice: number, categoryId?: string, description = ""): Promise<boolean> {
  if (!email || !productId || !name) return false;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    await prisma.product.update({
      where: { id: productId, userId: user.id },
      data: { name, unitPrice, categoryId, description }
    });
    return true;
  } catch (e) {
    console.error('Erreur modification produit:', e);
    return false;
  }
}



