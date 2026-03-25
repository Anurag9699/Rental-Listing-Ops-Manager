import axios from 'axios';

const AVAILABILITY_ENGINE_URL = process.env.AVAILABILITY_ENGINE_URL || 'http://localhost:3002/api/availability';

export class AvailabilityService {
    /**
     * Checks if a listing is available for a given date range by calling the Availability Engine.
     */
    static async validateAvailability(listingId: string, startDate: string, endDate: string): Promise<boolean> {
        try {
            const response = await axios.post(`${AVAILABILITY_ENGINE_URL}/validate`, {
                listingId,
                startDate,
                endDate
            });
            return response.data.isValid;
        } catch (error) {
            console.error('Error calling Availability Engine:', error);
            // Default to unavailable if service is down for safety
            return false;
        }
    }

    /**
     * Internal method to block dates (e.g., when a booking is confirmed)
     */
    static async blockDates(listingId: string, startDate: string, endDate: string, reason: string) {
        try {
            const response = await axios.post(`${AVAILABILITY_ENGINE_URL}/block`, {
                listingId,
                startDate,
                endDate,
                blockReason: reason
            });
            return response.data;
        } catch (error) {
            console.error('Error calling Availability Engine to block dates:', error);
            throw new Error('Failed to block dates in Availability Engine');
        }
    }
}
