const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Generate and store text embedding for an item.
 * Call this after saving item to DB.
 */
async function generateTextEmbedding(itemId, title, description) {
    try {
        const text = `${title}. ${description}`.trim();
        
        const response = await axios.post(`${AI_SERVICE_URL}/ai/embed/text`, {
            item_id: itemId,
            text: text
        });
        
        return response.data;
    } catch (error) {
        // Log but don't crash — item is saved, embedding can be retried
        console.error(`Text embedding failed for item ${itemId}:`, error.message);
        return null;
    }
}

/**
 * Generate and store image embedding for an item.
 * Call this after image is saved to disk/storage.
 */
async function generateImageEmbedding(itemId, imagePath) {
    try {
        const form = new FormData();
        form.append('item_id', itemId.toString());
        form.append('image', fs.createReadStream(imagePath));
        
        const response = await axios.post(
            `${AI_SERVICE_URL}/ai/embed/image`,
            form,
            { headers: form.getHeaders() }
        );
        
        return response.data;
    } catch (error) {
        console.error(`Image embedding failed for item ${itemId}:`, error.message);
        return null;
    }
}

/**
 * Find matches for a found item against all lost items.
 * Call this after a found item is saved + embedded.
 */
async function findMatchesForFoundItem(foundItemId) {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/match`, {
            found_item_id: foundItemId
        });
        
        return response.data.matches || [];
    } catch (error) {
        console.error(`Matching failed for found item ${foundItemId}:`, error.message);
        return [];
    }
}

/**
 * Find matches for a lost item against all found items.
 * Call this after a lost item is saved + embedded.
 */
async function findMatchesForLostItem(lostItemId) {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/rematch`, {
            found_item_id: lostItemId  // field name matches Python route
        });
        
        return response.data.matches || [];
    } catch (error) {
        console.error(`Rematching failed for lost item ${lostItemId}:`, error.message);
        return [];
    }
}

module.exports = {
    generateTextEmbedding,
    generateImageEmbedding,
    findMatchesForFoundItem,
    findMatchesForLostItem
};