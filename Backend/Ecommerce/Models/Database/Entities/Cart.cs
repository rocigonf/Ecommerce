﻿using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

namespace Ecommerce.Models.Database.Entities;

[Index(nameof(Id), IsUnique = true)]
public class Cart
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;
}
