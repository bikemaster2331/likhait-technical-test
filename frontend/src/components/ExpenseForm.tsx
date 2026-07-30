/**
 * Form component for adding/editing expenses
 */

import React, { useEffect, useState } from "react";
import { ExpenseFormData } from "../types";
import { EXPENSE_CATEGORIES } from "../constants/categories";
import { TextField, SelectBox, Button, Modal } from "../vibes";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { addCategory, fetchCategories } from "../services/api";

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Expense",
}: ExpenseFormProps) {
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useExpenseForm({
      initialData,
      onSubmit,
    });

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  };
  /*
   * This converts the initial hardcoded categories into the { value, label }
   * format required by SelectBox.
   */
  const defaultCategoryOptions: Array<{ value: string; label: string }> =
    EXPENSE_CATEGORIES.map((category) => ({
      value: category,
      label: category,
    }));
  const [categoryOptions, setCategoryOptions] = useState(
    defaultCategoryOptions,
  );

  /*
   * These state variables keep track of the Add Category modal, the name the
   * user entered, whether it is being saved, and any error to show the user.
   */
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string>();

  /*
   * This runs when the form first opens. It gets the categories saved in the
   * backend and replaces the initial hardcoded list in the dropdown.
   */
  useEffect(() => {
    // This prevents updating the form after it has been closed.
    let isMounted = true;

    fetchCategories()
      .then((categories) => {
        if (isMounted) {
          setCategoryOptions(
            categories.map((category) => ({
              value: category.name,
              label: category.name,
            })),
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * This opens a modal where the user can type the name of their new category.
   */
  const openCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError(undefined);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (isAddingCategory) {
      return;
    }

    setIsCategoryModalOpen(false);
    setNewCategoryName("");
    setCategoryError(undefined);
  };

  /*
   * This saves the category from the modal in the backend, then adds and
   * selects it in the dropdown.
   */
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();

    if (!name) {
      setCategoryError("Category name is required.");
      return;
    }

    if (
      categoryOptions.some(
        (category) => category.value.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setCategoryError("That category already exists.");
      return;
    }

    setCategoryError(undefined);
    setIsAddingCategory(true);

    try {
      const category = await addCategory(name);

      setCategoryOptions((previousOptions) =>
        [
          ...previousOptions,
          { value: category.name, label: category.name },
        ].sort((a, b) => a.label.localeCompare(b.label)),
      );
      handleChange("category", category.name);
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error creating category:", error);
      setCategoryError(
        error instanceof Error
          ? error.message
          : "Could not add the category. Please try again.",
      );
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyle}>
        <TextField
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          error={errors.amount}
          fullWidth
          required
        />

        <TextField
          label="Description"
          type="text"
          placeholder="Enter description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          error={errors.description}
          fullWidth
          required
        />

        <SelectBox
          label="Category"
          options={categoryOptions}
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          error={errors.category}
          fullWidth
          required
        />
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={openCategoryModal}
          disabled={isAddingCategory}
        >
          Add Category
        </Button>

        <TextField
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
          error={errors.date}
          fullWidth
          required
        />

        <div style={buttonGroupStyle}>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title="Add Category"
        maxWidth="400px"
      >
        <div style={formStyle}>
          <TextField
            label="Category name"
            type="text"
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddCategory();
              }
            }}
            error={categoryError}
            fullWidth
            disabled={isAddingCategory}
            maxLength={100}
            autoFocus
          />
          <div style={buttonGroupStyle}>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddCategory}
              disabled={isAddingCategory}
            >
              {isAddingCategory ? "Adding..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={closeCategoryModal}
              disabled={isAddingCategory}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
