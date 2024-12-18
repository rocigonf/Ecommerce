﻿using Ecommerce.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SmartSearchController : ControllerBase
{
    [HttpGet]
    public IEnumerable<string> Search([FromQuery] string query)
    {
        SmartSearchService smartSearchService = new SmartSearchService();

        return smartSearchService.Search(query);
    }
}
