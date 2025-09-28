import { Firestore } from "firebase-admin/firestore";
import { CheckoutDocument } from "../checkouts/checkout.types";
import { VoucherDocument } from "./voucher.types";
import { RegistrationDocument } from "../registrations/registration.types";
import { EventDocument } from "../../types/events";

export type ValidateVoucherResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export type VoucherData = VoucherDocument & {
  id: string;
}

export async function validateVoucher(firestore: Firestore, voucherData: VoucherData): Promise<ValidateVoucherResult> {
  if (!voucherData.active) {
    return { valid: false, message: "Voucher foi desabilitado pelo comprador. Entre em contato com o responsável." };
  }

  const buyerCheckoutDoc = await firestore.collection("checkouts").doc(voucherData.checkoutId).get();
  const buyerCheckoutData = buyerCheckoutDoc.data() as CheckoutDocument;

  if (!buyerCheckoutData) {
    return { valid: false, message: "Comprador não encontrado. Por favor, entre em contato com o suporte." };
  }

  if (buyerCheckoutData.status === "deleted") {
    return { valid: false, message: "Comprador não encontrado. Por favor, entre em contato com o responsável pela compra." };
  }

  if (buyerCheckoutData.status !== "completed" && buyerCheckoutData.status !== "pending") {
    return { valid: false, message: "Compra de inscrições incompleta. Por favor, entre em contato com o responsável pela compra." };
  }

  const eventDoc = await firestore.collection("events").doc(buyerCheckoutData.eventId).get();
  const eventData = eventDoc.data() as EventDocument;

  if (!eventData) {
    return { valid: false, message: "Evento não encontrado. Por favor, entre em contato com o suporte." };
  }

  if (eventData.status === "closed") {
    return { valid: false, message: "Evento já ocorreu e não está mais disponível para inscrições." };
  }

  if (eventData.status === "canceled") {
    return { valid: false, message: "Evento cancelado e não está mais disponível para inscrições." };
  }

  if (!buyerCheckoutData.amount) {
    return { valid: false, message: "Compra do voucher não tem um número válido de inscrições." };
  }

  const registrationsSnapshot = await firestore
    .collection("registrations")
    .where("checkoutId", "==", voucherData.checkoutId)
    .where("status", "in", ["ok", "pending"])
    .get();

  const validRegistrations = registrationsSnapshot.docs.map((doc) => ({...doc.data() as RegistrationDocument, id: doc.id}))/* .filter((reg) => reg.checkoutId !== reg.id) */;

  const complimentary = buyerCheckoutData.complimentary || 0;
  const maxRegistrations = buyerCheckoutData.amount + complimentary;

  if (validRegistrations.length >= maxRegistrations) {
    return { valid: false, message: "Número máximo de inscrições já atingido para este voucher." };
  }

  return { valid: true };
}