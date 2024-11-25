using Ecommerce;
using Ecommerce.Models.Database;
using Ecommerce.Models.Database.Repositories.Implementations;
using Ecommerce.Models.Mappers;
using Ecommerce.Models.ReviewModels;
using Ecommerce.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.ML;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Stripe;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Leer la configuración de Stripe y mapearla a Settings
builder.Services.Configure<Settings>(builder.Configuration.GetSection("Stripe"));

// Inyectamos el DbContext
builder.Services.AddScoped<EcommerceContext>();
builder.Services.AddScoped<UnitOfWork>();

// Inyección de todos los repositorios
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<ReviewRepository>();
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<ProductOrderRepository>();
builder.Services.AddScoped<ProductCartRepository>();
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<TemporalOrderRepository>();
builder.Services.AddScoped<TemporalProductOrderRepository>();
builder.Services.AddScoped<CartRepository>();
builder.Services.AddScoped<CheckoutRepository>();

// Inyección de Mappers
builder.Services.AddScoped<UserMapper>();
builder.Services.AddScoped<CartMapper>();
builder.Services.AddScoped<ProductCartMapper>();

// Inyección de Servicios
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<ProductCartService>();
builder.Services.AddScoped<TemporalOrderService>();
builder.Services.AddScoped<Ecommerce.Services.ProductService>();
builder.Services.AddScoped<Ecommerce.Services.ReviewService>();
builder.Services.AddScoped<SmartSearchService>();
builder.Services.AddScoped<Ecommerce.Services.CheckoutService>();

builder.Services.AddHostedService<OrderExpiresService>();


// Inyeccion de la IA
builder.Services.AddPredictionEnginePool<ModelInput, ModelOutput>()
    .FromFile("ReviewAI.mlnet");


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuración de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.AllowAnyOrigin() // Permitir cualquier origen
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});


// Configuración de autenticaci�n
builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        string key = "A8$wX#pQ3dZ7v&kB1nY!rT@9mL%j6sHf4^g2Uc5*o";

        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// wwwroot
app.UseStaticFiles();

// Permite CORS
app.UseCors("AllowAllOrigins");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


await SeedDataBaseAsync(app.Services);


// Configuramos Stripe
InitStripe(app.Services);

static void InitStripe(IServiceProvider serviceProvider)
{
    using IServiceScope scope = serviceProvider.CreateScope();
    IOptions<Settings> options = scope.ServiceProvider.GetService<IOptions<Settings>>();

    // Accedemos a nuestra clave secreta desde la configuración.
    string stripeSecretKey = options.Value.StripeSecret;

    // Configuramos Stripe con la clave secreta
    StripeConfiguration.ApiKey = stripeSecretKey;
}


app.Run();

// metodo para el seeder
static async Task SeedDataBaseAsync(IServiceProvider serviceProvider)
{
    using IServiceScope scope = serviceProvider.CreateScope();
    using EcommerceContext dbContext = scope.ServiceProvider.GetService<EcommerceContext>();

    // Si no existe la base de datos, la creamos y ejecutamos el seeder
    if (dbContext.Database.EnsureCreated())
    {
        Seeder seeder = new Seeder(dbContext);
        await seeder.SeedAsync();
    }
}
