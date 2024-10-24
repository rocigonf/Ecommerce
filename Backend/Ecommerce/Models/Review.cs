﻿using System;
using System.Collections.Generic;

namespace Ecommerce.Models;

public partial class Review
{
    public string Text { get; set; } = null!;

    public string Category { get; set; } = null!;

    public DateTime PublicationDate { get; set; }

    public int ReviewId { get; set; }

    public int UserId { get; set; }

    public int ProductId { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
