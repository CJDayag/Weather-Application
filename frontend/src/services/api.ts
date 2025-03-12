const API_URL = '/api';  // Production
// const API_URL = 'http://localhost:8000/api';  // Development

export const fetchData = async () => {
  const response = await fetch(`${API_URL}/forecast/<int:location_id>/`);
  return await response.json();
};