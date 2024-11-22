﻿using Ecommerce.Models.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Models.Dtos;


public class ProductCartDto
{
    public int Quantity { get; set; }

    public int CartId { get; set; }
    
    public int ProductId { get; set; }

    public Product Product { get; set; }

}
