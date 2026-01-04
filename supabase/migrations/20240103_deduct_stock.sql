-- Function to deduct stock safely
CREATE OR REPLACE FUNCTION deduct_stock(ing_id UUID, qty NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE ingredients
  SET current_stock = current_stock - qty
  WHERE id = ing_id;
END;
$$ LANGUAGE plpgsql;
