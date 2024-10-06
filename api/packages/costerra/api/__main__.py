import os
import asyncio
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import odc.stac
import planetary_computer
import pystac_client
import numpy as np
import pandas as pd

class NDVIRequest(BaseModel):
    latitude: float = 38.6
    longitude: float = -121.5
    buffer: float = 1
    year: str = '2021'

def verify_api_key(provided_key):
    expected_key = os.environ.get('API_KEY')
    return provided_key == expected_key

async def get_ndvi(request: NDVIRequest):
    try:
        catalog = pystac_client.Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier=planetary_computer.sign_inplace,
        )

        latitude = request.latitude
        longitude = request.longitude
        buffer = 1
        bbox = [longitude - buffer, latitude - buffer, longitude + buffer, latitude + buffer]
        months = {
            "January": "01",
            "April": "04",
            "July": "07",
            "October": "10",
        }
        items = dict()

        for name, number in months.items():
            datetime = f"{request.year}-{number}"
            search = catalog.search(
                collections=["modis-13A1-061"],
                bbox=bbox,
                datetime=datetime,
            )
            items[name] = search.get_all_items()[0]

        data = odc.stac.load(
            items.values(),
            crs="EPSG:3857",
            bands="500m_16_days_NDVI",
            resolution=500,
            bbox=bbox,
        )

        raster = items["January"].assets["500m_16_days_NDVI"].extra_fields["raster:bands"]
        data = data["500m_16_days_NDVI"] * raster[0]["scale"]

        # Process NDVI data
        ndvi_stats = {}
        for time, month_data in data.groupby('time'):
            month_name = pd.to_datetime(time).strftime('%B')
            
            # Calculate statistics
            valid_data = month_data.where(month_data != -0.3)  # Exclude no-data values
            stats = {
                'mean_ndvi': float(valid_data.mean().values),
                'max_ndvi': float(valid_data.max().values),
                'min_ndvi': float(valid_data.min().values),
                'std_ndvi': float(valid_data.std().values),
                'harvestable_area_percentage': float((valid_data > 0.4).sum() / valid_data.count() * 100)
            }
            ndvi_stats[month_name] = stats

        # Calculate overall statistics
        overall_stats = {
            'mean_annual_ndvi': np.mean([s['mean_ndvi'] for s in ndvi_stats.values()]),
            'peak_ndvi_month': max(ndvi_stats, key=lambda k: ndvi_stats[k]['mean_ndvi']),
            'lowest_ndvi_month': min(ndvi_stats, key=lambda k: ndvi_stats[k]['mean_ndvi']),
            'mean_harvestable_area_percentage': np.mean([s['harvestable_area_percentage'] for s in ndvi_stats.values()])
        }

        return JSONResponse(content={
            "ndvi_stats_by_month": ndvi_stats,
            "overall_stats": overall_stats,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "buffer": request.buffer,
            "year": request.year
        })

    except Exception as e:
        print(f"Error in get_ndvi: {str(e)}")
        import traceback
        traceback.print_exc()

def main(params):
    """
    This is the main function that is called when the API is called.

    Parameters:
    params: dict
        The parameters passed to the function.

    Returns:
    dict
        The response from the function.
    """
    # Check for API key
    api_key = params.get('api_key')
    if not verify_api_key(api_key):
        return {
            "statusCode": 403,
            "body": "Invalid API key"
        }

    # If API key is valid, proceed with the function
    try:
        request = NDVIRequest(**params)
        # Use asyncio to run the async function
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(get_ndvi(request))
        return {
            "statusCode": 200,
            "body": result.body.decode(),  # Assuming JSONResponse returns bytes
            "headers": {
                "Content-Type": "application/json"
            }
        }
    except Exception as e:
        print(f"Error in main function: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": "Internal server error"
        }