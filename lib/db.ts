import { supabase } from "./supabase";

export const db = {
  user: {
    findUnique: async ({
      where,
      include,
    }: {
      where: { email?: string; id?: string };
      include?: { accounts?: boolean };
    }): Promise<any> => {
      let query: any = supabase
        .from("User")
        .select(include?.accounts ? "*, accounts:Account(*)" : "*");
      if (where.email) query = query.eq("email", where.email);
      if (where.id) query = query.eq("id", where.id);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return null;
      return data as any;
    },
    create: async ({ data }: { data: any }) => {
      const { accounts, ...userData } = data;
      const { data: newUser, error } = await supabase
        .from("User")
        .insert({
          email: userData.email,
          name: userData.name || null,
          image: userData.image || null,
          role: userData.role || "USER",
        })
        .select()
        .single();
      if (error || !newUser) {
        console.error("Error creating user in Supabase:", error);
        return null;
      }
      if (accounts?.create) {
        await supabase.from("Account").insert({
          user_id: newUser.id,
          type: accounts.create.type,
          provider: accounts.create.provider,
          providerAccountId: accounts.create.providerAccountId,
          refresh_token: accounts.create.refreshToken,
          access_token: accounts.create.accessToken,
          expires_at: accounts.create.expiresAt,
          token_type: accounts.create.tokenType,
          scope: accounts.create.scope,
          id_token: accounts.create.idToken,
          session_state: accounts.create.sessionState,
        });
      }
      return newUser;
    },
  },

  account: {
    findUnique: async ({
      where,
    }: {
      where: {
        provider_providerAccountId: {
          provider: string;
          providerAccountId: string;
        };
      };
    }) => {
      const { provider, providerAccountId } = where.provider_providerAccountId;
      const { data } = await supabase
        .from("Account")
        .select("*")
        .eq("provider", provider)
        .eq("providerAccountId", providerAccountId)
        .maybeSingle();
      return data;
    },
    findFirst: async ({ where }: { where: { userId: string } }) => {
      const { data } = await supabase
        .from("Account")
        .select("*")
        .eq("user_id", where.userId)
        .maybeSingle();
      return data;
    },
    create: async ({ data }: { data: any }) => {
      const { data: newAccount, error } = await supabase
        .from("Account")
        .insert({
          user_id: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refreshToken,
          access_token: data.accessToken,
          expires_at: data.expiresAt,
          token_type: data.tokenType,
          scope: data.scope,
          id_token: data.idToken,
          session_state: data.sessionState,
        })
        .select()
        .single();
      if (error) console.error("Error creating account in Supabase:", error);
      return newAccount;
    },
  },

  playground: {
    findMany: async ({
      where,
    }: {
      where?: { userId?: string };
      include?: any;
    } = {}) => {
      let query = supabase.from("Playground").select(`
        *,
        user:User(*),
        Starmark:StarMark(isMarked, userId)
      `);
      if (where?.userId) {
        query = query.eq("userId", where.userId);
      }
      const { data, error } = await query.order("createdAt", {
        ascending: false,
      });
      if (error) {
        console.error("Error fetching playgrounds from Supabase:", error);
        return [];
      }
      return (data || []).map((p: any) => ({
        ...p,
        Starmark: (p.Starmark || []).filter(
          (s: any) => !where?.userId || s.userId === where.userId
        ),
      }));
    },
    findUnique: async ({
      where,
    }: {
      where: { id: string };
      select?: any;
    }) => {
      let query = supabase
        .from("Playground")
        .select(`
          *,
          templateFiles:TemplateFile(content)
        `)
        .eq("id", where.id);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return null;
      return data;
    },
    create: async ({
      data,
    }: {
      data: {
        title: string;
        description?: string | null;
        template: string;
        userId: string;
      };
    }) => {
      const { data: newPlayground, error } = await supabase
        .from("Playground")
        .insert({
          title: data.title,
          description: data.description || null,
          template: data.template,
          userId: data.userId,
        })
        .select()
        .single();
      if (error) {
        console.error("Error creating playground in Supabase:", error);
        return null;
      }
      return newPlayground;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const { data: updated, error } = await supabase
        .from("Playground")
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", where.id)
        .select()
        .single();
      if (error) console.error("Error updating playground in Supabase:", error);
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const { error } = await supabase
        .from("Playground")
        .delete()
        .eq("id", where.id);
      if (error) console.error("Error deleting playground in Supabase:", error);
      return true;
    },
  },

  starMark: {
    create: async ({
      data,
    }: {
      data: { userId: string; playgroundId: string; isMarked: boolean };
    }) => {
      const { data: star, error } = await supabase
        .from("StarMark")
        .insert({
          userId: data.userId,
          playgroundId: data.playgroundId,
          isMarked: data.isMarked,
        })
        .select()
        .single();
      if (error) console.error("Error creating starMark in Supabase:", error);
      return star;
    },
    delete: async ({
      where,
    }: {
      where: {
        userId_playgroundId: { userId: string; playgroundId: string };
      };
    }) => {
      const { userId, playgroundId } = where.userId_playgroundId;
      const { error } = await supabase
        .from("StarMark")
        .delete()
        .eq("userId", userId)
        .eq("playgroundId", playgroundId);
      if (error) console.error("Error deleting starMark in Supabase:", error);
      return true;
    },
  },

  templateFile: {
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { playgroundId: string };
      update: any;
      create: any;
    }) => {
      const { data: existing } = await supabase
        .from("TemplateFile")
        .select("id")
        .eq("playgroundId", where.playgroundId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("TemplateFile")
          .update({
            content:
              typeof update.content === "string"
                ? JSON.parse(update.content)
                : update.content,
            updatedAt: new Date().toISOString(),
          })
          .eq("playgroundId", where.playgroundId)
          .select()
          .single();
        if (error)
          console.error("Error updating templateFile in Supabase:", error);
        return data;
      } else {
        const { data, error } = await supabase
          .from("TemplateFile")
          .insert({
            playgroundId: create.playgroundId,
            content:
              typeof create.content === "string"
                ? JSON.parse(create.content)
                : create.content,
          })
          .select()
          .single();
        if (error)
          console.error("Error creating templateFile in Supabase:", error);
        return data;
      }
    },
  },

  chatMessage: {
    create: async ({
      data,
    }: {
      data: { userId: string; role: string; content: string };
    }) => {
      const { data: msg, error } = await supabase
        .from("ChatMessage")
        .insert(data)
        .select()
        .single();
      if (error) console.error("Error creating chatMessage in Supabase:", error);
      return msg;
    },
  },
};

export default db;