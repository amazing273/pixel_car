const CAR_MODELS = [
    "Lada 2101", "Lada 2107", "Lada 2109", "Lada 2110", "Lada Priora", "Lada Granta", "Lada Vesta", "Niva 4x4", "Volga 3110", "GAZ 21",
    "Toyota Supra", "Toyota AE86", "Nissan Skyline R34", "Nissan Silvia S15", "Mazda RX-7", "Mazda RX-8", "Mitsubishi Evo X", "Subaru WRX STI", "Honda Civic", "Honda NSX",
    "BMW E30", "BMW M3 E46", "BMW M5", "Mercedes 190E", "Mercedes G-Class", "Audi Quattro", "Audi RS6", "Porsche 911", "VW Golf", "VW Passat",
    "Ford Mustang", "Ford Focus RS", "Chevrolet Camaro", "Chevrolet Corvette", "Dodge Charger", "Dodge Challenger", "Dodge Viper", "Tesla Model S", "Tesla Roadster", "Jeep Wrangler",
    "Ferrari F40", "Ferrari Enzo", "Lamborghini Diablo", "Lamborghini Aventador", "Bugatti Veyron", "Bugatti Chiron", "McLaren F1", "McLaren P1", "Pagani Zonda", "Koenigsegg"
];

const COLORS = ['#ffd700', '#ff3333', '#00ff88', '#0088ff', '#ffffff', '#ff00ff', '#00ffff', '#ff8800'];

const CARS_DB = [];
for (let i = 0; i < 100; i++) {
    const modelName = CAR_MODELS[i % CAR_MODELS.length] + " " + (Math.floor(i / 10) + 1);
    CARS_DB.push({
        id: i,
        name: modelName,
        color: COLORS[i % COLORS.length],
        baseSpeed: 180 + Math.floor(Math.random() * 60) // Базовая скорость
    });
}

let currentCar = CARS_DB[0];
