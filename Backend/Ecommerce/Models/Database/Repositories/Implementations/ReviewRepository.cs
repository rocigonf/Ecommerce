﻿using Ecommerce.Models.Database.Entities;

namespace Ecommerce.Models.Database.Repositories.Implementations
{
    public class ReviewRepository : Repository<Review>
    {
        public ReviewRepository(EcommerceContext context) : base(context)
        {

        }
    }
}
