-- Drop existing FK constraints and re-add with ON DELETE CASCADE

-- kit_mockups.kit_id → kits.id
ALTER TABLE "kit_mockups" DROP CONSTRAINT IF EXISTS "kit_mockups_kit_id_kits_id_fk";
ALTER TABLE "kit_mockups" ADD CONSTRAINT "kit_mockups_kit_id_kits_id_fk"
  FOREIGN KEY ("kit_id") REFERENCES "kits"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- kit_item_variations.kit_item_id → kit_items.id
ALTER TABLE "kit_item_variations" DROP CONSTRAINT IF EXISTS "kit_item_variations_kit_item_id_kit_items_id_fk";
ALTER TABLE "kit_item_variations" ADD CONSTRAINT "kit_item_variations_kit_item_id_kit_items_id_fk"
  FOREIGN KEY ("kit_item_id") REFERENCES "kit_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- kit_item_variation_options.kit_item_variation_id → kit_item_variations.id
ALTER TABLE "kit_item_variation_options" DROP CONSTRAINT IF EXISTS "kit_item_variation_options_kit_item_variation_id_kit_item_variations_id_fk";
ALTER TABLE "kit_item_variation_options" ADD CONSTRAINT "kit_item_variation_options_kit_item_variation_id_kit_item_variations_id_fk"
  FOREIGN KEY ("kit_item_variation_id") REFERENCES "kit_item_variations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
