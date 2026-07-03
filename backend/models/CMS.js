import mongoose from 'mongoose';

const CMSBannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  linkUrl: { type: String },
  activeFrom: Date,
  activeTo: Date,
  isActive: { type: Boolean, default: true }
});

const CMSConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true }, // e.g. 'home_banners' or 'bento_grid_priority'
  banners: [CMSBannerSchema],
  bentoGridOrder: [{ type: String }], // Array of product ids representing priority order
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.CMSConfig || mongoose.model('CMSConfig', CMSConfigSchema);
