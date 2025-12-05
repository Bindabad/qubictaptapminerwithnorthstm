import { supabase, GiftCard } from '../lib/supabase';
import { walletService } from './walletService';

export class GiftCardService {
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createGiftCard(
    senderId: string,
    recipientEmail: string,
    amount: number,
    message: string = ''
  ): Promise<GiftCard> {
    const senderBalance = await walletService.getUserBalance(senderId);

    if (senderBalance < amount) {
      throw new Error('Insufficient balance to create gift card');
    }

    await walletService.deductBalance(senderId, amount);

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        code,
        sender_id: senderId,
        recipient_email: recipientEmail,
        amount,
        message,
        status: 'active',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: senderId,
        type: 'send_gift',
        amount: -amount,
        reference_id: data.id,
        description: `Sent gift card to ${recipientEmail}`
      });

    if (txError) console.error('Transaction log error:', txError);

    return data;
  }

  async redeemGiftCard(code: string, userId: string): Promise<GiftCard> {
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) throw error;
    if (!giftCard) throw new Error('Gift card not found');
    if (giftCard.status !== 'active') {
      throw new Error(`Gift card is ${giftCard.status}`);
    }

    if (new Date(giftCard.expires_at) < new Date()) {
      await supabase
        .from('gift_cards')
        .update({ status: 'expired' })
        .eq('id', giftCard.id);
      throw new Error('Gift card has expired');
    }

    if (giftCard.sender_id === userId) {
      throw new Error('Cannot redeem your own gift card');
    }

    const currentBalance = await walletService.getUserBalance(userId);
    await walletService.updateBalance(userId, currentBalance + giftCard.amount);

    const { data: updatedCard, error: updateError } = await supabase
      .from('gift_cards')
      .update({
        status: 'redeemed',
        redeemed_by: userId,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', giftCard.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'receive_gift',
        amount: giftCard.amount,
        reference_id: giftCard.id,
        description: `Redeemed gift card worth ${giftCard.amount} QUBIC`
      });

    if (txError) console.error('Transaction log error:', txError);

    return updatedCard;
  }

  async getUserSentGiftCards(userId: string): Promise<GiftCard[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserReceivedGiftCards(userId: string): Promise<GiftCard[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('redeemed_by', userId)
      .order('redeemed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | null> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const giftCardService = new GiftCardService();
