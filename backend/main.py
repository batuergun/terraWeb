from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import odc.stac
import planetary_computer
import pystac_client
import numpy as np
import pandas as pd
app = FastAPI()

class NDVIRequest(BaseModel):
    latitude: float = 38.6
    longitude: float = -121.5
    buffer: float = 1
    year: str = '2021'

@app.post("/get_ndvi")
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

        print(items)

        data = odc.stac.load(
            items.values(),
            crs="EPSG:3857",
            bands="500m_16_days_NDVI",
            resolution=500,
            bbox=bbox,
        )

        raster = items["January"].assets["500m_16_days_NDVI"].extra_fields["raster:bands"]
        data = data["500m_16_days_NDVI"] * raster[0]["scale"]
        print(data)

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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)