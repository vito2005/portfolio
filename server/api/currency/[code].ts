export default defineEventHandler(async (event) => {
    const code = getRouterParam(event, "code");
    const { currencyKey } = useRuntimeConfig();
    const { data } = await $fetch(
        `https://api.currencyapi.com/v3/latest?base_currency=USD&currencies=${code}`,
        {
            headers: {
                'apikey': currencyKey
            }
        }
    );
    return data;
});