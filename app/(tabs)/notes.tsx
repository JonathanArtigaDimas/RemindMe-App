import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ScrollView,
  Image, FlatList, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, useThemeColors, RADIUS } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useNoteStore } from '../../src/store/noteStore';
import { Note } from '../../src/types';
import * as Haptics from 'expo-haptics';
import { QuickNoteModal } from '../../src/components/notes/QuickNoteModal';
import { takePhoto, pickFromGallery } from '../../src/services/mediaService';

const AVAILABLE_TAGS = ['Trabajo', 'Personal', 'Ideas', 'Importante', 'Amor', 'Estudio'];

export default function NotesScreen() {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const { notes, tags, addNote, updateNote, deleteNote, togglePin, addCustomTag } = useNoteStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [quickNoteVisible, setQuickNoteVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  const fontStyle = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) };
  const fontBold  = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'bold') };
  const fontItalic = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'italic') };

  // ── Handlers ────────────────────────────────────────────────────
  const handleSave = () => {
    if (!title.trim() && !content.trim() && !editImageUri) return;
    if (editingNote) {
      updateNote(editingNote.id, {
        title, content, tags: selectedTags,
        imageUri: editImageUri || undefined,
      });
    } else {
      addNote({
        title, content, isPinned: false,
        tags: selectedTags,
        imageUri: editImageUri || undefined,
      });
    }
    closeModal();
    if (settings.hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setNewTagInput('');
    setEditImageUri(null);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedTags(note.tags || []);
    setEditImageUri(note.imageUri || null);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar nota', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNote(id) },
    ]);
  };

  const handleAddPhoto = async (source: 'camera' | 'gallery') => {
    const uri = source === 'camera' ? await takePhoto() : await pickFromGallery();
    if (uri) setEditImageUri(uri);
  };

  // ── Filtered notes ───────────────────────────────────────────────
  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedFilterTag
      ? (n.tags || []).includes(selectedFilterTag)
      : true;
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // ── Note Card ────────────────────────────────────────────────────
  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => openEdit(item)}
      activeOpacity={0.7}
    >
      {/* Image thumbnail */}
      {item.imageUri && (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.noteImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.noteHeader}>
        <Text numberOfLines={1} style={[styles.noteTitle, { color: colors.text }, fontBold]}>
          {item.title || 'Sin título'}
        </Text>
        <TouchableOpacity onPress={() => togglePin(item.id)}>
          <Ionicons
            name={item.isPinned ? 'pin' : 'pin-outline'}
            size={16}
            color={item.isPinned ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Audio badge */}
      {item.audioUri && (
        <View style={[styles.audioBadge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="mic" size={11} color={colors.primary} />
          <Text style={[styles.audioBadgeText, { color: colors.primary }, fontStyle]}>
            {' '}Nota de voz
          </Text>
        </View>
      )}

      <Text numberOfLines={2} style={[styles.noteSnippet, { color: colors.textSecondary }, fontItalic]}>
        {item.audioTranscript || item.content || 'Sin contenido'}
      </Text>

      {/* Tags */}
      {(item.tags && item.tags.length > 0) && (
        <View style={styles.noteTagsRow}>
          {item.tags.map(tag => (
            <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.tagText, { color: colors.primary }, fontStyle]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: colors.textTertiary }, fontStyle]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={15} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ── FAB ──────────────────────────────────────────────────────────
  const fabScale = React.useRef(new Animated.Value(1)).current;
  const onFabPressIn  = () => Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }).start();
  const onFabPressOut = () => Animated.spring(fabScale, { toValue: 1,   useNativeDriver: true }).start();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }, fontBold]}>Mis Notas</Text>
        <TouchableOpacity
          style={[styles.newNoteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={[styles.newNoteBtnText, { color: colors.primary }, fontBold]}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }, fontStyle]}
          placeholder="Buscar notas..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tag Filter ── */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedFilterTag
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setSelectedFilterTag(null)}
          >
            <Text style={[styles.filterText, { color: !selectedFilterTag ? '#FFF' : colors.textSecondary }, fontStyle]}>
              Todo
            </Text>
          </TouchableOpacity>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterChip, selectedFilterTag === tag
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setSelectedFilterTag(tag === selectedFilterTag ? null : tag)}
            >
              <Text style={[styles.filterText, { color: selectedFilterTag === tag ? '#FFF' : colors.textSecondary }, fontStyle]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Notes Grid ── */}
      <FlatList
        data={filteredNotes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }, fontStyle]}>
              No hay notas aún
            </Text>
          </View>
        }
      />

      {/* ── Full Note Editor Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={[styles.modalAction, { color: colors.textSecondary }, fontStyle]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }, fontBold]}>
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.modalAction, { color: colors.primary, fontWeight: '700' }, fontBold]}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image in editor */}
              {editImageUri ? (
                <View style={{ marginBottom: SPACING.md }}>
                  <Image source={{ uri: editImageUri }} style={styles.editImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={[styles.removeImageBtn, { backgroundColor: colors.error }]}
                    onPress={() => setEditImageUri(null)}
                  >
                    <Ionicons name="close" size={14} color="#FFF" />
                    <Text style={[{ color: '#FFF', fontSize: 12 }, fontStyle]}> Quitar imagen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickRow}>
                  <TouchableOpacity
                    style={[styles.imagePickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleAddPhoto('camera')}
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={[styles.imagePickText, { color: colors.primary }, fontStyle]}>Cámara</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imagePickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleAddPhoto('gallery')}
                  >
                    <Ionicons name="images-outline" size={20} color={colors.primary} />
                    <Text style={[styles.imagePickText, { color: colors.primary }, fontStyle]}>Galería</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }, fontBold]}
                placeholder="Título"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Tags selection */}
              <View style={styles.tagsSelectionContainer}>
                <Text style={[styles.tagsLabel, { color: colors.textSecondary }, fontBold]}>
                  Etiquetas (Opcional):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsSelectionScroll}>
                  {tags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tagSelectionChip, isSelected
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => {
                          if (isSelected) setSelectedTags(selectedTags.filter(t => t !== tag));
                          else setSelectedTags([...selectedTags, tag]);
                        }}
                      >
                        <Text style={[styles.filterText, { color: isSelected ? '#FFF' : colors.textSecondary }, fontStyle]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={[styles.tagSelectionChip, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 0 }]}>
                    <TextInput
                      style={[{ color: colors.text, fontSize: 14, minWidth: 80 }, fontStyle]}
                      placeholder="+ Nueva"
                      placeholderTextColor={colors.textTertiary}
                      value={newTagInput}
                      onChangeText={setNewTagInput}
                      onSubmitEditing={() => {
                        const t = newTagInput.trim();
                        if (t) {
                          addCustomTag(t);
                          if (!selectedTags.includes(t)) setSelectedTags([...selectedTags, t]);
                          setNewTagInput('');
                        }
                      }}
                    />
                  </View>
                </ScrollView>
              </View>

              <TextInput
                style={[styles.contentInput, { color: colors.text }, fontStyle]}
                placeholder="Empieza a escribir..."
                placeholderTextColor={colors.textTertiary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Quick Note Modal (FAB) ── */}
      <QuickNoteModal
        visible={quickNoteVisible}
        onClose={() => setQuickNoteVisible(false)}
      />

      {/* ── FAB ── */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.primary }]}
          onPress={() => setQuickNoteVisible(true)}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={0.9}
        >
          <Ionicons name="flash" size={26} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: SPACING.base,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  newNoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.lg, borderWidth: 1,
  },
  newNoteBtnText: { fontSize: 14, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.base, marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md, height: 46,
    borderRadius: RADIUS.lg,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filterContainer: { marginBottom: SPACING.sm },
  filterScroll: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  filterText: { fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 110 },
  columnWrapper: { justifyContent: 'space-between' },
  noteCard: {
    width: '48%', borderRadius: RADIUS.lg,
    marginBottom: SPACING.md, borderWidth: 1, overflow: 'hidden',
  },
  noteImage: { width: '100%', height: 110 },
  noteHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm, marginBottom: 4,
  },
  noteTitle: { fontSize: 14, fontWeight: 'bold', flex: 1, marginRight: 4 },
  audioBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.sm, marginBottom: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: RADIUS.sm, alignSelf: 'flex-start',
  },
  audioBadgeText: { fontSize: 10, fontWeight: '600' },
  noteSnippet: {
    fontSize: 12, lineHeight: 17, marginBottom: 8,
    paddingHorizontal: SPACING.sm,
  },
  noteTagsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 4, paddingHorizontal: SPACING.sm, marginBottom: 6,
  },
  tagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  tagText: { fontSize: 10, fontWeight: '600' },
  noteFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm,
  },
  noteDate: { fontSize: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16 },

  // Full editor modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    height: '92%', borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalAction: { fontSize: 16 },
  editImage: { width: '100%', height: 200, borderRadius: RADIUS.md },
  removeImageBtn: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  imagePickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  imagePickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1,
  },
  imagePickText: { fontSize: 14, fontWeight: '600' },
  titleInput: {
    fontSize: 22, fontWeight: 'bold',
    paddingBottom: SPACING.sm, marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  tagsSelectionContainer: { marginBottom: SPACING.md },
  tagsLabel: { fontSize: 14, marginBottom: SPACING.sm },
  tagsSelectionScroll: { gap: SPACING.sm },
  tagSelectionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  contentInput: { fontSize: 17, lineHeight: 24, minHeight: 180 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  fabBtn: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
});
