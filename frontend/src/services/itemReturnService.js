import apiClient from "./apiClient";

export async function returnInventory({
  issuedItemId,
  quantityReturned,
  conditionStatus,
  remarks,
}) {
  const response = await apiClient.post(
    `/api/item-returns/issued-item/${issuedItemId}`,
    {
      quantityReturned,
      conditionStatus,
      remarks,
    },
  );

  return response.data.data;
}

export async function getReturnsByIssuedItem(
  issuedItemId,
) {
  const response = await apiClient.get(
    `/api/item-returns/issued-item/${issuedItemId}`,
  );

  return response.data.data;
}