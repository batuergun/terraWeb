import axios from 'axios';

export async function fetchAgricultureData(lat: number, lng: number) {
  try {
    const response = await axios.post('/api/nvdi', {
      params: {
        lat,
        lng
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching agriculture data:', error);
    throw new Error('Failed to fetch agriculture data');
  }
}